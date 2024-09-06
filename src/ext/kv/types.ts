export type SimpleMap<K, V> = {
  set(key: K, value: V): void
  get(key: K): V | null
  delete(key: K): void
  entries(): IterableIterator<[K, V]>
}
