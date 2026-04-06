import {
  DEFAULT_INDEXED_DB_NAME,
  DEFAULT_INDEXED_DB_STORE_NAME,
} from "../../../core/constants.ts";
import type {
  BasicMap,
  CreateIndexedDbAdapterOptions,
  IndexedDbAdapterOptions,
} from "./types.ts";

/**
 * Helper function for opening an IndexedDB database instance
 * and creating a BasicMap adapter for `IndexedDB`.
 *
 * Enables an `IndexedDB` database to be utilized as a basic map.
 *
 * @param options - Optional configuration for the IndexedDB database and store.
 *
 * @return - A promise that resolves to an `IndexedDbAdapter` instance, which is a BasicMap adapter for the specified IndexedDB database and store.
 *
 * @example
 * ```ts
 * // Creates a new BasicMap, wrapping an IndexedDB database with default name and store
 * const map = await indexedDbAdapter()
 * ```
 *
 * @example
 * ```ts
 * // Creates a new BasicMap, wrapping an IndexedDB database configured by the provided options
 * const map = await indexedDbAdapter({ name: "my-db", storeName: "my-store", version: 1 })
 * ```
 */
export async function indexedDbAdapter(
  { name, storeName, version }: CreateIndexedDbAdapterOptions = {},
): Promise<IndexedDbAdapter<IDBValidKey, unknown>> {
  const request = indexedDB.open(name ?? DEFAULT_INDEXED_DB_NAME, version);

  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const objectStoreName = storeName ?? DEFAULT_INDEXED_DB_STORE_NAME;
      const db = request.result;
      if (db.objectStoreNames.contains(objectStoreName)) {
        return;
      }

      db.createObjectStore(objectStoreName);
    };
  });

  return new IndexedDbAdapter({
    db,
    storeName: storeName ?? DEFAULT_INDEXED_DB_STORE_NAME,
  });
}

/**
 * BasicMap adapter for `IndexedDB`.
 *
 * Enables an `IndexedDB` database to be utilized as a basic map.
 *
 * @example
 * ```ts
 * const request = indexedDB.open("my-db");
 *
 * const db = await new Promise<IDBDatabase>((resolve, reject) => {
 *   request.onerror = () => reject(request.error);
 *   request.onsuccess = () => resolve(request.result);
 *   request.onupgradeneeded = () => {
 *     request.result.createObjectStore("my-store");
 *  };
 * });
 *
 * // Creates a new BasicMap, wrapping an IndexedDB database
 * const map = new IndexedDbAdapter({ db, storeName: "my-store" })
 * ```
 */
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

  close(): void {
    this.db.close();
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
