import type {
  DenoAtomicOperation,
  DenoKv,
  DenoKvCommitError,
  DenoKvCommitResult,
  DenoKvEnqueueOptions,
  DenoKvEntryMaybe,
  DenoKvListIterator,
  DenoKvListOptions,
  DenoKvListSelector,
  DenoKvSetOptions,
  DenoKvStrictKey,
  DenoKvWatchOptions,
} from "../../../core/types.ts";
import { MapKvAtomicOperation } from "./atomic.ts";
import { Watcher } from "../common/watcher.ts";
import { createVersionstamp } from "../common/utils.ts";
import type { BasicMap, MapKvOptions } from "./types.ts";
import { allFulfilled } from "../../../core/utils.ts";
import { AsyncLock } from "../common/async_lock.ts";
import {
  activateQueuedValues,
  deleteEntry,
  enqueueValue,
  getEntry,
  type KvEntry,
  listEntries,
  setEntry,
} from "../common/entry_handlers.ts";

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
  private map: BasicMap<string, KvEntry>;
  private clearOnClose: boolean;
  private watchers: Watcher[];
  private listenHandlers: ((msg: unknown) => unknown)[];
  private asyncLock: AsyncLock;
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
    this.asyncLock = new AsyncLock();

    entries?.forEach(({ key, ...data }) =>
      this.setDocument(
        key as DenoKvStrictKey,
        data.value,
        data.versionstamp,
        undefined,
        true,
      )
    );

    activateQueuedValues({
      listenHandlers: this.listenHandlers,
      getEntries: () => this.getEntries(),
      get: (keyStr) => this.map.get(keyStr),
      delete: (keyStr) => this.map.delete(keyStr),
    });
  }

  async close(): Promise<void> {
    this.watchers.forEach((w) => w.cancel());
    this.listener?.resolve();
    this.asyncLock.cancel();
    if (this.clearOnClose) await this.map.clear();
  }

  async delete(key: DenoKvStrictKey): Promise<void> {
    await this.deleteDocument(key, true);
  }

  async get(key: DenoKvStrictKey): Promise<DenoKvEntryMaybe> {
    return await this.getDocument(key, true);
  }

  async getMany(keys: DenoKvStrictKey[]): Promise<DenoKvEntryMaybe[]> {
    return await allFulfilled(keys.map((key) => this.get(key)));
  }

  async set(
    key: DenoKvStrictKey,
    value: unknown,
    options?: DenoKvSetOptions,
  ): Promise<DenoKvCommitError | DenoKvCommitResult> {
    return await this.setDocument(
      key,
      value,
      createVersionstamp(),
      options,
      true,
    );
  }

  async list(
    selector: DenoKvListSelector,
    options?: DenoKvListOptions,
  ): Promise<DenoKvListIterator> {
    return await listEntries({
      selector,
      options,
      watchers: this.watchers,
      getEntries: () => this.getEntries(),
      get: (keyStr) => this.map.get(keyStr),
      delete: (keyStr) => this.map.delete(keyStr),
      lock: this.asyncLock,
    });
  }

  listenQueue(handler: (value: unknown) => unknown): Promise<void> {
    this.listenHandlers.push(handler);

    if (!this.listener) {
      this.listener = Promise.withResolvers();
    }

    return this.listener.promise;
  }

  async enqueue(
    value: unknown,
    options?: DenoKvEnqueueOptions,
  ): Promise<DenoKvCommitResult> {
    return await this.enqueueValue(value, createVersionstamp(), options);
  }

  watch(
    keys: DenoKvStrictKey[],
    options?: DenoKvWatchOptions,
  ): ReadableStream<DenoKvEntryMaybe[]> {
    const getter = (key: DenoKvStrictKey) => {
      return getEntry({
        key,
        watchers: [],
        get: (keyStr) => this.map.get(keyStr),
        delete: (keyStr) => this.map.delete(keyStr),
        lock: null,
        checkExpire: false,
      });
    };

    const watcher = new Watcher(keys, options, getter);
    this.watchers.push(watcher);
    return watcher.stream;
  }

  atomic(): DenoAtomicOperation {
    return new MapKvAtomicOperation(this, this.asyncLock);
  }

  private async getDocument(
    key: DenoKvStrictKey,
    lock: boolean,
  ): Promise<DenoKvEntryMaybe> {
    return await getEntry({
      key,
      watchers: this.watchers,
      get: (keyStr) => this.map.get(keyStr),
      delete: (keyStr) => this.map.delete(keyStr),
      lock: lock ? this.asyncLock : null,
      checkExpire: true,
    });
  }

  private async setDocument(
    key: DenoKvStrictKey,
    value: unknown,
    versionstamp: string,
    options: DenoKvSetOptions | undefined,
    lock: boolean,
  ): Promise<DenoKvCommitError | DenoKvCommitResult> {
    return await setEntry({
      key,
      value,
      versionstamp,
      get: (keyStr) => this.map.get(keyStr),
      set: (keyStr, entry) => this.map.set(keyStr, entry),
      delete: (keyStr) => this.map.delete(keyStr),
      watchers: this.watchers,
      options,
      lock: lock ? this.asyncLock : null,
    });
  }

  private async deleteDocument(
    key: DenoKvStrictKey,
    lock: boolean,
  ): Promise<void> {
    await deleteEntry({
      key,
      watchers: this.watchers,
      get: (keyStr) => this.map.get(keyStr),
      delete: (keyStr) => this.map.delete(keyStr),
      lock: lock ? this.asyncLock : null,
    });
  }

  private async enqueueValue(
    value: unknown,
    versionstamp: string,
    options?: DenoKvEnqueueOptions,
  ): Promise<DenoKvCommitResult> {
    return await enqueueValue({
      value,
      versionstamp,
      options,
      listenHandlers: this.listenHandlers,
      get: (keyStr) => this.map.get(keyStr),
      set: (keyStr, entry) => this.map.set(keyStr, entry),
      delete: (keyStr) => this.map.delete(keyStr),
    });
  }

  private async getEntries(): Promise<[string, KvEntry][]> {
    return await Array.fromAsync(this.map.entries());
  }
}
