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
  activateQueuedValues,
  deleteEntry,
  enqueueValue,
  getEntry,
  type KvEntry,
  listEntries,
  setEntry,
} from "../common/entry_handlers.ts";
import { createVersionstamp } from "../common/utils.ts";
import { Watcher } from "../common/watcher.ts";
import { AsyncLock } from "../map/async_lock.ts";

type IndexedDbOptions = {
  db: IDBDatabase;
  storeName?: string;
};

export class IndexedDbKv implements DenoKv {
  private db: IDBDatabase;
  private storeName: string;
  private watchers: Watcher[];
  private listenHandlers: ((msg: unknown) => unknown)[];
  private asyncLock: AsyncLock;
  private listener:
    | {
      promise: Promise<void>;
      resolve: () => void;
    }
    | undefined;

  private get objStore(): IDBObjectStore {
    return this.db.transaction(this.storeName, "readwrite").objectStore(
      this.storeName,
    );
  }

  constructor({ db, storeName = "__kvdex_store__" }: IndexedDbOptions) {
    this.db = db;
    this.storeName = storeName;
    this.watchers = [];
    this.listenHandlers = [];
    this.asyncLock = new AsyncLock();

    activateQueuedValues({
      listenHandlers: this.listenHandlers,
      get: (keyStr) => this.getDbEntry(keyStr),
      getEntries: () => this.getDbEntries(),
      delete: (keyStr) => this.deleteDbEntry(keyStr),
    });
  }

  async delete(key: DenoKvStrictKey): Promise<void> {
    await deleteEntry({
      key,
      watchers: this.watchers,
      get: (keyStr) => this.getDbEntry(keyStr),
      delete: (keyStr) => this.deleteDbEntry(keyStr),
      lock: this.asyncLock,
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
      delete: (keyStr) => this.deleteDbEntry(keyStr),
      watchers: this.watchers,
      options,
      lock: this.asyncLock,
    });
  }

  async get(
    key: DenoKvStrictKey,
  ): Promise<DenoKvEntryMaybe> {
    return await getEntry({
      key,
      watchers: this.watchers,
      get: (keyStr) => this.getDbEntry(keyStr),
      delete: (keyStr) => this.deleteDbEntry(keyStr),
      lock: null, // TODO
      checkExpire: true,
    });
  }

  async getMany(
    keys: DenoKvStrictKey[],
  ): Promise<DenoKvEntryMaybe[]> {
    return await allFulfilled(keys.map((key) => this.get(key)));
  }

  async list(
    selector: DenoKvListSelector,
    options?: DenoKvListOptions,
  ): Promise<DenoKvListIterator> {
    return await listEntries({
      selector,
      options,
      watchers: this.watchers,
      getEntries: () => this.getDbEntries(),
      get: (keyStr) => this.getDbEntry(keyStr),
      delete: (keyStr) => this.deleteDbEntry(keyStr),
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
        get: (keyStr) => this.getDbEntry(keyStr),
        delete: (keyStr) => this.deleteDbEntry(keyStr),
        lock: null,
        checkExpire: false,
      });
    };

    const watcher = new Watcher(keys, options, getter);
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

  private async getDbEntry(key: IDBValidKey): Promise<KvEntry | null> {
    const req = this.objStore.get(key);
    return await this.handleDbRequest(req);
  }

  private async setDbEntry(key: IDBValidKey, entry: KvEntry): Promise<void> {
    const req = this.objStore.put(entry, key);
    await this.handleDbRequest(req);
  }

  private async deleteDbEntry(key: IDBValidKey): Promise<void> {
    const req = this.objStore.delete(key);
    await this.handleDbRequest(req);
  }

  private async getDbEntries(): Promise<Array<[string, KvEntry]>> {
    const req = this.objStore.getAllKeys();
    const keys = await this.handleDbRequest(req);

    const entries = await allFulfilled(keys.map(async (key) => {
      const entry = await this.getDbEntry(key);
      return entry ? [key, entry] as const : null;
    }));

    return entries.filter((entry): entry is [string, KvEntry] =>
      entry !== null
    );
  }

  private handleDbRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
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
      get: (keyStr) => this.getDbEntry(keyStr),
      set: (keyStr, entry) => this.setDbEntry(keyStr, entry),
      delete: (keyStr) => this.deleteDbEntry(keyStr),
    });
  }
}
