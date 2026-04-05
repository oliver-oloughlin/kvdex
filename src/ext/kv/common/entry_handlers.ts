import { jsonStringify } from "../../../common/json.ts";
import { safeAwait } from "../../../common/safe_await.ts";
import type {
  DenoKvCommitError,
  DenoKvCommitResult,
  DenoKvEntryMaybe,
  DenoKvEntryNull,
  DenoKvSetOptions,
  DenoKvStrictKey,
  KvValue,
} from "../../../core/types.ts";
import { allFulfilled } from "../../../core/utils.ts";
import type { AsyncLock } from "../map/async_lock.ts";
import type { Watcher } from "./watcher.ts";

export type KvEntry = {
  value: unknown;
  versionstamp: string;
  expireAt: number | null;
};

export type Getter = (
  key: string,
) => KvEntry | undefined | null | Promise<KvEntry | undefined | null>;

export type Setter = (key: string, entry: KvEntry) => unknown;

export type Deleter = (key: string) => unknown;

export async function setEntry({
  key,
  value,
  versionstamp,
  get,
  set,
  delete: del,
  watchers,
  options,
  lock,
}: {
  key: DenoKvStrictKey;
  value: unknown;
  versionstamp: string;
  get: Getter;
  set: Setter;
  delete: Deleter;
  watchers: Watcher[];
  options?: DenoKvSetOptions;
  lock: AsyncLock | null;
}): Promise<DenoKvCommitError | DenoKvCommitResult> {
  const fn = async () => {
    const keyStr = jsonStringify(key);
    const prev = await safeAwait(get(keyStr));

    const doesExpire = hasExpireIn(options);
    const expireAt = doesExpire ? Date.now() + options.expireIn : null;

    const entry = {
      value,
      versionstamp,
      expireAt,
    } satisfies KvEntry;

    await safeAwait(set(keyStr, entry));
    await updateWatchers({ watchers, keyStr, prev, value, get, delete: del });
  };

  if (lock) {
    const result = await lock.run(fn);
    if (result.status === "fulfilled") {
      return { ok: true, versionstamp };
    }
  }

  await fn();

  return {
    ok: true,
    versionstamp,
  };
}

export async function getEntry({
  key,
  watchers,
  get,
  delete: del,
  lock,
  checkExpire,
}: {
  key: DenoKvStrictKey;
  watchers: Watcher[];
  get: Getter;
  delete: Deleter;
  lock: AsyncLock | null;
  checkExpire: boolean;
}): Promise<DenoKvEntryMaybe> {
  const fn = async () => {
    const keyStr = jsonStringify(key);
    const entry = await safeAwait(get(keyStr)) as KvEntry | undefined | null;

    const nullEntry = {
      key,
      value: null,
      versionstamp: null,
    } satisfies DenoKvEntryNull;

    if (!entry) {
      return nullEntry;
    }

    if (checkExpire && isExpired(entry)) {
      await deleteEntry({ key, watchers, get, delete: del, lock: null });
      return nullEntry;
    }

    return {
      key,
      value: entry.value as KvValue,
      versionstamp: entry.versionstamp,
    };
  };

  if (lock) {
    const result = await lock.run(fn);
    return result.status === "fulfilled" ? result.value : {
      key,
      value: null,
      versionstamp: null,
    };
  }

  return await fn();
}

export async function deleteEntry({
  key,
  watchers,
  get,
  delete: del,
  lock,
}: {
  key: DenoKvStrictKey;
  watchers: Watcher[];
  get: Getter;
  delete: Deleter;
  lock: AsyncLock | null;
}) {
  const fn = async () => {
    const keyStr = jsonStringify(key);
    const prev = await get(keyStr);
    await del(keyStr);
    return { keyStr, prev };
  };

  if (lock) {
    const result = await lock.run(fn);
    if (result.status === "fulfilled") {
      await updateWatchers({
        watchers,
        ...result.value,
        value: undefined,
        get,
        delete: del,
      });
    }
  } else {
    const result = await fn();
    await updateWatchers({
      watchers,
      ...result,
      value: undefined,
      get,
      delete: del,
    });
  }
}

function hasExpireIn(
  options: DenoKvSetOptions | undefined,
): options is { expireIn: number } {
  return options?.expireIn !== undefined;
}

function isExpired(entry: KvEntry): boolean {
  return entry.expireAt !== null && entry.expireAt <= Date.now();
}

async function updateWatchers({ watchers, keyStr, prev, value }: {
  watchers: Watcher[];
  keyStr: string;
  prev: KvEntry | undefined | null;
  value: unknown;
  get: Getter;
  delete: Deleter;
}) {
  await allFulfilled(
    watchers.map((w) => w.update(keyStr, prev?.value, value)),
  );
}
