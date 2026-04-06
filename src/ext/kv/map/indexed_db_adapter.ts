import {
  DEFAULT_INDEXED_DB_NAME,
  DEFAULT_INDEXED_DB_STORE_NAME,
} from "../../../core/constants.ts";
import type { BasicMap } from "./types.ts";

type IndexedDbAdapterOptions = {
  db: IDBDatabase;
  storeName: string;
};

type CreateIndexedDbAdapterOptions = {
  name?: string;
  storeName?: string;
  version?: number;
};

export async function indexedDbAdapter(
  { name, storeName, version }: CreateIndexedDbAdapterOptions = {},
) {
  const request = indexedDB.open(name ?? DEFAULT_INDEXED_DB_NAME, version);

  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore(storeName ?? DEFAULT_INDEXED_DB_STORE_NAME);
    };
  });

  return new IndexedDbAdapter({
    db,
    storeName: storeName ?? DEFAULT_INDEXED_DB_STORE_NAME,
  });
}

export class IndexedDbAdapter<K extends IDBValidKey, V>
  implements BasicMap<K, V> {
  private db: IDBDatabase;
  private storeName: string;

  private get store() {
    return this.db
      .transaction(this.storeName, "readwrite")
      .objectStore(this.storeName);
  }

  constructor({ db, storeName }: IndexedDbAdapterOptions) {
    this.db = db;
    this.storeName = storeName;
  }

  async set(key: K, value: V): Promise<void> {
    const req = this.store.put(value, key);
    await this.handleDbRequest(req);
  }

  async get(key: K): Promise<V | undefined> {
    const req = this.store.get(key);
    return await this.handleDbRequest(req);
  }

  async delete(key: K): Promise<void> {
    const req = this.store.delete(key);
    await this.handleDbRequest(req);
  }

  async clear(): Promise<void> {
    const req = this.store.clear();
    await this.handleDbRequest(req);
  }

  async *entries(): AsyncIterableIterator<[K, V]> {
    const req = this.store.openCursor();

    while (true) {
      const cursor = await this.handleDbRequest(req);
      if (!cursor) {
        break;
      }

      yield [cursor.key as K, cursor.value as V];
      cursor.continue();
    }
  }

  private handleDbRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
