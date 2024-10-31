import { jsonParse, jsonStringify } from "../encoding/json.ts";
import type { BasicMap } from "./types.ts";

/**
 * BasicMap adapter for Storage.
 *
 * Enables a Storage object, such as `localStorage`, to be utilized as a basic map.
 *
 * Wraps `localStorage` by default.
 *
 * @example
 * ```ts
 * // Creates a new BasicMap, wrapping `localStorage`
 * const map = new StorageAdapter()
 * ```
 *
 * @example
 * ```ts
 * // Creates a new BasicMap, explicitly wrapping `localStorage`
 * const map = new StorageAdapter(localStorage)
 * ```
 */
export class StorageAdapter<K, V> implements BasicMap<K, V> {
  private storage: Storage;

  constructor(storage: Storage = localStorage) {
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
