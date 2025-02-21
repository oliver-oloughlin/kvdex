import type {
  DenoAtomicOperation,
  DenoKv,
  DenoKvCommitResult,
  DenoKvEnqueueOptions,
  DenoKvEntry,
  DenoKvEntryMaybe,
  DenoKvLaxKey,
  DenoKvListIterator,
  DenoKvListOptions,
  DenoKvListSelector,
  DenoKvSetOptions,
  DenoKvStrictKey,
  DenoKvWatchOptions,
} from "../../types.ts";
import { MapKvAtomicOperation } from "./atomic.ts";
import { Watcher } from "./watcher.ts";
import { createVersionstamp, keySort } from "./utils.ts";
import type { BasicMap, MapKvOptions } from "./types.ts";
import { jsonParse, jsonStringify } from "../encoding/json/utils.ts";
import { allFulfilled } from "../../utils.ts";
import { AsyncLock } from "./async_lock.ts";

/**
 * KV instance utilising a `BasicMap` as it's backend.
 *
 * Uses `new Map()` by default.
 *
 * @example
 * ```ts
 * // Initializes a new KV instance wrapping the built-in `Map`
 * const kv = new MapKv()
 * ```
 *
 * @example
 * ```ts
 * // Initializes a new KV instance utilizing `localStorage` as it's backend
 * const map = new StorageAdapter()
 * const kv = new MapKv({ map })
 * ```
 *
 * @example
 * ```ts
 * // Initializes a new ephimeral KV instance explicitly utilizing `localStorage` as it's backend
 * const map = new StorageAdapter(localStorage)
 * const kv = new MapKv({ map, clearOnClose: true })
 * ```
 */
export class MapKv implements DenoKv {
  private map: BasicMap<string, Omit<DenoKvEntry, "key">>;
  private clearOnClose: boolean;
  private watchers: Watcher[];
  private listenHandlers: ((msg: unknown) => unknown)[];
  private atomicLock: AsyncLock;
  private listener:
    | {
      promise: Promise<void>;
      resolve: () => void;
    }
    | undefined;

  constructor({
    map = new Map(),
    entries,
    clearOnClose = false,
  }: MapKvOptions = {}) {
    this.map = map;
    this.clearOnClose = clearOnClose;
    this.watchers = [];
    this.listenHandlers = [];
    this.atomicLock = new AsyncLock();

    entries?.forEach(({ key, ...data }) =>
      this.map.set(jsonStringify(key), data)
    );
  }

  async close(): Promise<void> {
    this.watchers.forEach((w) => w.cancel());
    this.listener?.resolve();
    this.atomicLock.cancel();
    if (this.clearOnClose) await this.map.clear();
  }

  async delete(key: DenoKvStrictKey): Promise<void> {
    const keyStr = jsonStringify(key);
    const prev = await this.map.get(keyStr);
    await this.map.delete(jsonStringify(key));
    await allFulfilled(
      this.watchers.map((w) => w.update(keyStr, prev?.value, undefined)),
    );
  }

  async get(key: DenoKvStrictKey): Promise<DenoKvEntryMaybe> {
    const data = await this.map.get(jsonStringify(key)) ?? {
      value: null,
      versionstamp: null,
    };

    return {
      ...data,
      key: key as DenoKvLaxKey,
    };
  }

  async getMany(keys: DenoKvStrictKey[]): Promise<DenoKvEntryMaybe[]> {
    return await allFulfilled(keys.map((key) => this.get(key)));
  }

  async set(
    key: DenoKvStrictKey,
    value: unknown,
    options?: DenoKvSetOptions,
  ): Promise<DenoKvCommitResult> {
    return await this.setDocument(key, value, createVersionstamp(), options);
  }

  async list(
    selector: DenoKvListSelector,
    options?: DenoKvListOptions,
  ): Promise<DenoKvListIterator> {
    let entries = await Array.fromAsync(this.map.entries());
    const start = (selector as any).start as DenoKvStrictKey | undefined;
    const end = (selector as any).end as DenoKvStrictKey | undefined;
    const prefix = (selector as any).prefix as DenoKvStrictKey | undefined;

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

  listenQueue(handler: (value: unknown) => unknown): Promise<void> {
    this.listenHandlers.push(handler);

    if (!this.listener) {
      this.listener = Promise.withResolvers();
    }

    return this.listener.promise;
  }

  enqueue(
    value: unknown,
    options?: DenoKvEnqueueOptions,
  ): Promise<DenoKvCommitResult> | DenoKvCommitResult {
    return this.enqueueValue(value, createVersionstamp(), options);
  }

  watch(
    keys: DenoKvStrictKey[],
    options?: DenoKvWatchOptions,
  ): ReadableStream<DenoKvEntryMaybe[]> {
    const watcher = new Watcher(this, keys, options);
    this.watchers.push(watcher);
    return watcher.stream;
  }

  atomic(): DenoAtomicOperation {
    return new MapKvAtomicOperation(this, this.atomicLock);
  }

  private async setDocument(
    key: DenoKvStrictKey,
    value: unknown,
    versionstamp: string,
    options?: DenoKvSetOptions,
  ): Promise<DenoKvCommitResult> {
    const keyStr = jsonStringify(key);
    const prev = await this.map.get(keyStr);

    await this.map.set(keyStr, {
      value,
      versionstamp: versionstamp,
    });

    await allFulfilled(
      this.watchers.map((w) => w.update(keyStr, prev?.value, value)),
    );

    if (options?.expireIn !== undefined) {
      setTimeout(() => this.map.delete(keyStr), options.expireIn);
    }

    return {
      ok: true,
      versionstamp,
    };
  }

  private enqueueValue(
    value: unknown,
    versionstamp: string,
    options?: DenoKvEnqueueOptions,
  ): Promise<DenoKvCommitResult> | DenoKvCommitResult {
    setTimeout(async () => {
      await Promise.all(this.listenHandlers.map((h) => h(value)));
    }, options?.delay ?? 0);

    return {
      ok: true,
      versionstamp,
    };
  }
}
