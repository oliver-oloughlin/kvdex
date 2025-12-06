import { jsonStringify } from "../../../common/json.ts";
import { safeAwait } from "../../../common/safe_await.ts";
import type {
  DenoKvCommitResult,
  DenoKvEntryMaybe,
  DenoKvEntryNull,
  DenoKvSetOptions,
  DenoKvStrictKey,
  KvValue,
} from "../../../core/types.ts";
import { allFulfilled } from "../../../core/utils.ts";
import type { Watcher } from "./watcher.ts";

export type KvEntry = {
  value: unknown;
  versionstamp: string;
  expireAt: number | null;
};

export async function setEntry({
  key,
  value,
  versionstamp,
  get,
  set,
  watchers,
  options,
}: {
  key: DenoKvStrictKey;
  value: unknown;
  versionstamp: string;
  get: (
    key: string,
  ) => KvEntry | undefined | null | Promise<KvEntry | undefined | null>;
  set: (key: string, entry: KvEntry) => unknown;
  watchers: Watcher[];
  options?: DenoKvSetOptions;
}): Promise<DenoKvCommitResult> {
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

  await allFulfilled(
    watchers.map((w) => w.update(keyStr, prev?.value, value)),
  );

  return {
    ok: true,
    versionstamp,
  };
}

export async function getEntry({
  key,
  get,
  delete: del,
}: {
  key: DenoKvStrictKey;
  get: (
    key: string,
  ) => KvEntry | undefined | null | Promise<KvEntry | undefined | null>;
  delete: (key: string) => unknown;
}): Promise<DenoKvEntryMaybe> {
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

  if (isExpired(entry)) {
    await safeAwait(del(keyStr));
    return nullEntry;
  }

  return {
    key,
    value: entry.value as KvValue,
    versionstamp: entry.versionstamp,
  };
}

export async function deleteEntry({
  key,
  watchers,
  get,
  delete: del,
}: {
  key: DenoKvStrictKey;
  watchers: Watcher[];
  get: (
    key: string,
  ) => KvEntry | undefined | null | Promise<KvEntry | undefined | null>;
  delete: (key: string) => unknown;
}) {
  const keyStr = jsonStringify(key);
  const prev = await get(keyStr);
  await del(keyStr);
  await allFulfilled(
    watchers.map((w) => w.update(keyStr, prev?.value, undefined)),
  );
}

function hasExpireIn(
  options: DenoKvSetOptions | undefined,
): options is { expireIn: number } {
  return options?.expireIn !== undefined;
}

function isExpired(entry: KvEntry): boolean {
  return entry.expireAt !== null && entry.expireAt <= Date.now();
}
