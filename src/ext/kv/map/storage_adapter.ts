import { jsonParse, jsonStringify } from "../../../common/json.ts";
import type { BasicMap } from "./types.ts";

/**
 * BasicMap adapter for the `Storage` interface.
 *
 * Enables a `Storage` object, such as `localStorage` and `sessionStorage`, to be utilized as a BasicMap.
 *
 * @example
 * ```ts
 * // Creates a new BasicMap, wrapping `localStorage`
 * const map = new StorageAdapter(localStorage)
 * ```
 *
 * @example
 * ```ts
 * // Creates a new BasicMap, wrapping `sessionStorage`
 * const map = new StorageAdapter(sessionStorage)
 * ```
 */
export class StorageAdapter<K, V> implements BasicMap<K, V> {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  set(key: K, value: V): void {
    this.storage.setItem(jsonStringify(key), jsonStringify(value));
  }

  get(key: K): V | undefined {
    const valStr = this.storage.getItem(jsonStringify(key));
    return !valStr ? undefined : jsonParse<V>(valStr);
  }

  delete(key: K): void {
    this.storage.removeItem(jsonStringify(key));
  }

  *entries(): IterableIterator<[K, V]> {
    for (let i = 0; i < this.storage.length; i++) {
      const keyStr = this.storage.key(i);
      if (!keyStr) return;

      const valStr = this.storage.getItem(keyStr);
      if (!valStr) return;

      const key = jsonParse<K>(keyStr);
      const value = jsonParse<V>(valStr);
      yield [key, value];
    }
  }

  clear(): void {
    this.storage.clear();
  }
}
