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
import { allFulfilled } from "../../../core/utils.ts";
import {
  deleteEntry,
  getEntry,
  type KvEntry,
  setEntry,
} from "../common/entry_handlers.ts";
import { createVersionstamp } from "../common/utils.ts";
import { Watcher } from "../common/watcher.ts";

type IndexedDbOptions = {
  db: IDBDatabase;
  storeName?: string;
};

export class IndexedDbKv implements DenoKv {
  private db: IDBDatabase;
  private storeName: string;
  private watchers: Watcher[];

  private get objStore(): IDBObjectStore {
    return this.db.transaction(this.storeName, "readwrite").objectStore(
      this.storeName,
    );
  }

  constructor({ db, storeName = "__kvdex_store__" }: IndexedDbOptions) {
    this.db = db;
    this.storeName = storeName;
    this.watchers = [];
  }

  async delete(key: DenoKvStrictKey): Promise<void> {
    await deleteEntry({
      key,
      watchers: this.watchers,
      get: (keyStr) => this.getDbEntry(keyStr),
      delete: (keyStr) => this.deleteDbEntry(keyStr),
    });
  }

  async set(
    key: DenoKvStrictKey,
    value: unknown,
    options?: DenoKvSetOptions,
  ): Promise<DenoKvCommitResult | DenoKvCommitError> {
    return await setEntry({
      key,
      value,
      versionstamp: createVersionstamp(),
      get: (keyStr) => this.getDbEntry(keyStr),
      set: (keyStr, entry) => this.setDbEntry(keyStr, entry),
      watchers: this.watchers,
      options,
    });
  }

  async get(
    key: DenoKvStrictKey,
  ): Promise<DenoKvEntryMaybe> {
    return await getEntry({
      key,
      get: (keyStr) => this.getDbEntry(keyStr),
      delete: (keyStr) => this.deleteDbEntry(keyStr),
    });
  }

  async getMany(
    keys: DenoKvStrictKey[],
  ): Promise<DenoKvEntryMaybe[]> {
    return await allFulfilled(keys.map((key) => this.get(key)));
  }

  list(
    selector: DenoKvListSelector,
    options?: DenoKvListOptions,
  ): Promise<DenoKvListIterator> | DenoKvListIterator {
    throw new Error("Method not implemented.");
  }

  listenQueue(handler: (value: unknown) => unknown): Promise<void> {
    throw new Error("Method not implemented.");
  }

  enqueue(
    value: unknown,
    options?: DenoKvEnqueueOptions,
  ): Promise<DenoKvCommitResult> | DenoKvCommitResult {
    throw new Error("Method not implemented.");
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
    throw new Error("Method not implemented.");
  }

  close(): void {
    this.watchers.forEach((watcher) => watcher.cancel());
    this.db.close();
  }

  private getDbEntry(key: string): Promise<KvEntry | null> {
    const { promise, reject, resolve } = Promise.withResolvers<KvEntry>();

    const req = this.objStore.get(key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);

    return promise;
  }

  private setDbEntry(key: string, entry: KvEntry): Promise<void> {
    const { promise, reject, resolve } = Promise.withResolvers<void>();

    const req = this.objStore.put(entry, key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();

    return promise;
  }

  private deleteDbEntry(key: string): Promise<void> {
    const { promise, reject, resolve } = Promise.withResolvers<void>();

    const req = this.objStore.delete(key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();

    return promise;
  }
}
