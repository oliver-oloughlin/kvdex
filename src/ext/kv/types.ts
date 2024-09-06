import type { DenoKvEntry } from "../../types.ts"

export type SimpleMap<K, V> = {
  set(key: K, value: V): void
  get(key: K): V | undefined
  delete(key: K): void
  entries(): IterableIterator<[K, V]>
  clear(): void
}

/** Options when constructing a new MapKv instance. */
export type MapKvOptions = {
  /**
   * Underlying map used for data storage.
   *
   * @default new Map()
   */
  map?: SimpleMap<any, any>

  /** Initial KV entries. */
  entries?: DenoKvEntry[]

  /**
   * Whether the underlying map should be cleared or not when the store is closed.
   *
   * @default false
   */
  clearOnClose?: boolean
}
