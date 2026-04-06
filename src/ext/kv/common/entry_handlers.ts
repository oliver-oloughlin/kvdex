import { ulid } from "@std/ulid";
import { jsonParse, jsonStringify } from "../../../common/json.ts";
import { safeAwait } from "../../../common/safe_await.ts";
import { KVDEX_QUEUE_KEY_PREFIX } from "../../../core/constants.ts";
import type {
  DenoKv,
  DenoKvCommitError,
  DenoKvCommitResult,
  DenoKvEnqueueOptions,
  DenoKvEntryMaybe,
  DenoKvEntryNull,
  DenoKvLaxKey,
  DenoKvListIterator,
  DenoKvListOptions,
  DenoKvListSelector,
  DenoKvSetOptions,
  DenoKvStrictKey,
  KvValue,
} from "../../../core/types.ts";
import { allFulfilled } from "../../../core/utils.ts";
import type { AsyncLock } from "../map/async_lock.ts";
import type { Watcher } from "./watcher.ts";
import { createVersionstamp, keySort } from "./utils.ts";

export type KvEntry = {
  value: unknown;
  versionstamp: string;
  expireAt: number | null;
};

type Getter = (
  key: string,
) => KvEntry | undefined | null | Promise<KvEntry | undefined | null>;

type Setter = (key: string, entry: KvEntry) => unknown;

type Deleter = (key: string) => unknown;

type EntriesGetter = () => Promise<[string, KvEntry][]> | [
  string,
  KvEntry,
][];

type QueueEntryValue = {
  value: unknown;
  timestamp: number;
};

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

export async function enqueueValue({
  value,
  options,
  listenHandlers,
  kv,
}: {
  value: unknown;
  options: DenoKvEnqueueOptions | undefined;
  listenHandlers: ((value: unknown) => unknown)[];
  kv: DenoKv;
}): Promise<DenoKvCommitResult> {
  const timestamp = Date.now() + (options?.delay ?? 0);
  const id = ulid();
  const key: DenoKvStrictKey = [KVDEX_QUEUE_KEY_PREFIX, id];
  const entryValue: QueueEntryValue = {
    value,
    timestamp,
  };

  const cr = await kv.set(key, entryValue);

  setTimeout(async () => {
    await allFulfilled(listenHandlers.flatMap((handler) => [
      kv.delete(key),
      safeAwait(handler(value)),
    ]));
  }, options?.delay ?? 0);

  return {
    ok: true,
    versionstamp: cr.ok ? cr.versionstamp : createVersionstamp(),
  };
}

export async function activateQueuedValues({
  kv,
  listenHandlers,
}: {
  kv: DenoKv;
  listenHandlers: ((value: unknown) => unknown)[];
}) {
  const iter = await safeAwait(kv.list({ prefix: [KVDEX_QUEUE_KEY_PREFIX] }));
  for await (const entry of iter) {
    const { value, timestamp } = entry.value as QueueEntryValue;
    const delay = Math.max(timestamp - Date.now(), 0);

    setTimeout(async () => {
      await allFulfilled(listenHandlers.flatMap((handler) => [
        kv.delete(entry.key as DenoKvStrictKey),
        safeAwait(handler(value)),
      ]));
    }, delay);
  }
}

export async function listEntries({
  selector,
  options,
  watchers,
  getEntries,
  get,
  delete: del,
  lock,
}: {
  selector: DenoKvListSelector;
  options: DenoKvListOptions | undefined;
  watchers: Watcher[];
  getEntries: EntriesGetter;
  get: Getter;
  delete: Deleter;
  lock: AsyncLock | null;
}): Promise<DenoKvListIterator> {
  const start = (selector as any).start as DenoKvStrictKey | undefined;
  const end = (selector as any).end as DenoKvStrictKey | undefined;
  const prefix = (selector as any).prefix as DenoKvStrictKey | undefined;

  const fn = async () => {
    const allEntries = await getEntries();
    const validEntries = allEntries.filter(([_, entry]) => !isExpired(entry));
    const expiredEntries = allEntries.filter(([_, entry]) => isExpired(entry));

    await allFulfilled(
      expiredEntries.flatMap(([key, entry]) => [
        safeAwait(del(key)),
        updateWatchers({
          watchers,
          keyStr: key,
          prev: entry,
          value: undefined,
          get,
          delete: del,
        }),
      ]),
    );

    return validEntries;
  };

  let entries: [string, KvEntry][];
  if (lock) {
    const result = await lock.run(fn);
    entries = result.status === "fulfilled" ? result.value : [];
  } else {
    entries = await fn();
  }

  entries.sort(([k1], [k2]) => {
    const key1 = jsonParse<DenoKvStrictKey>(k1);
    const key2 = jsonParse<DenoKvStrictKey>(k2);
    return keySort(key1, key2);
  });

  if (options?.reverse) {
    entries.reverse();
  }

  if (prefix && prefix.length > 0) {
    entries = entries.filter(([key]) => {
      const parsedKey = jsonParse<DenoKvStrictKey>(key);
      const keyPrefix = parsedKey.slice(0, prefix.length);
      return jsonStringify(keyPrefix) === jsonStringify(prefix);
    });
  }

  if (start) {
    const index = entries.findIndex(
      ([key]) => key === jsonStringify(start),
    );

    if (index) {
      entries = entries.slice(index);
    }
  }

  if (end) {
    const index = entries.findIndex(
      ([key]) => key === jsonStringify(end),
    );

    if (index) {
      entries = entries.slice(0, index);
    }
  }

  if (options?.cursor) {
    const index = entries.findIndex(
      ([key]) => key === options.cursor,
    );

    if (index) {
      entries = entries.slice(index);
    }
  }

  const iter = async function* () {
    let count = 0;

    for (const [key, entry] of entries) {
      if (options?.limit !== undefined && count >= options?.limit) {
        return;
      }

      yield {
        key: jsonParse(key) as DenoKvLaxKey,
        ...entry,
      };

      count++;
    }
  };

  const cursorEntry = options?.limit ? entries.at(options?.limit) : undefined;
  const cursor = cursorEntry ? cursorEntry[0] : "";
  return Object.assign(iter(), { cursor });
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
