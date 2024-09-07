import type { DenoKvEntry } from "../../types.ts"

/** Interface for basic map methods */
export type BasicMap<K, V> = {
  /**
   * Set a new key/value entry.
   *
   * @param key - Key that identifies the entry.
   * @param value - Value of the entry.
   * @returns void
   */
  set(key: K, value: V): void

  /**
   * Get a key/value entry from the map.
   *
   * @param key - Key that identifies the entry.
   * @returns The entry value or undefined if it does not exist in the map.
   */
  get(key: K): V | undefined

  /**
   * Delete a key/value entry from the map.
   *
   * @param key - Key that identifies the entry.
   * @returns void
   */
  delete(key: K): void

  /**
   * Get an iterator of the key/value entries in the map.
   *
   * @returns An IterableIterator of [key, value] entries.
   */
  entries(): IterableIterator<[K, V]>

  /** Removes all key/value entries from the map. */
  clear(): void
}

/** Options when constructing a new MapKv instance. */
export type MapKvOptions = {
  /**
   * Underlying map used for data storage.
   *
   * @default new Map()
   */
  map?: BasicMap<any, any>

  /** Initial KV entries. */
  entries?: DenoKvEntry[]

  /**
   * Whether the underlying map should be cleared or not when the store is closed.
   *
   * @default false
   */
  clearOnClose?: boolean
}
