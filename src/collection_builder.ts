import { KvKey } from "../mod.ts"
import { Collection } from "./collection.ts"
import { IndexableCollection } from "./indexable_collection.ts"
import { LargeCollection } from "./large_collection.ts"
import type {
  CollectionOptions,
  IndexableCollectionOptions,
  KvValue,
  LargeCollectionOptions,
  LargeKvValue,
  Model,
} from "./types.ts"

/**
 * Initialize a collection builder.
 *
 * @returns Collection Builder.
 */
export function collection<const T extends KvValue>() {
  return new CollectionBuilder<T>()
}

/**
 * Initialize an indexable collection builder.
 *
 * @returns Indexable Collection Builder.
 */
export function indexableCollection<const T extends Model>() {
  return new IndexableCollectionBuilder<T>()
}

/**
 * Initialize a large collection builder.
 *
 * @returns Large Collection Builder.
 */
export function largeCollection<const T extends LargeKvValue>() {
  return new LargeCollectionBuilder<T>()
}

/**
 * Builder object for initilaizing a collection.
 */
class CollectionBuilder<const T extends KvValue> {
  /**
   * Build a collection from the set context and given options.
   *
   * @param def - Collection options.
   * @returns A Collection instance.
   */
  build(
    options?: CollectionOptions<T>,
  ) {
    return (kv: Deno.Kv, key: KvKey) =>
      new Collection<T, CollectionOptions<T>>(
        kv,
        key,
        options,
      )
  }
}

/**
 * Builder object for initializing an indexable collection.
 */
class IndexableCollectionBuilder<const T extends Model> {
  /**
   * Build an indexable collection from the set context and given options.
   *
   * @param options - IndexableCollection options.
   * @returns An IndexableCollection instance.
   */
  build<const T2 extends IndexableCollectionOptions<T>>(
    options: T2,
  ) {
    return (kv: Deno.Kv, key: KvKey) =>
      new IndexableCollection<T, T2>(
        kv,
        key,
        options,
      )
  }
}

/**
 * Builder object for initilaizing a collection.
 */
class LargeCollectionBuilder<const T extends LargeKvValue> {
  /**
   * Build a large collection from the set context and given options.
   *
   * @param options - LargeCollection options.
   * @returns A LargeCollection instance.
   */
  build(options?: LargeCollectionOptions<T>) {
    return (kv: Deno.Kv, key: KvKey) =>
      new LargeCollection<T, LargeCollectionOptions<T>>(
        kv,
        key,
        options,
      )
  }
}
