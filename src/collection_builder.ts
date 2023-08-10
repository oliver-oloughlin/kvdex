import { Collection } from "./collection.ts"
import { IndexableCollection } from "./indexable_collection.ts"
import { LargeCollection } from "./large_collection.ts"
import type {
  CollectionOptions,
  IndexableCollectionOptions,
  KvKey,
  KvValue,
  LargeCollectionOptions,
  LargeKvValue,
  Model,
} from "./types.ts"

export class CollectionBuilderContext {
  private kv: Deno.Kv
  private key: KvKey

  constructor(kv: Deno.Kv, key: KvKey) {
    this.kv = kv
    this.key = key
  }

  /**
   * Initialize a collection builder.
   *
   * @returns Collection Builder.
   */
  collection<const T extends KvValue>() {
    return new CollectionBuilder<T>(this.kv, this.key)
  }

  /**
   * Initialize an indexable collection builder.
   *
   * @returns Indexable Collection Builder.
   */
  indexableCollection<const T extends Model>() {
    return new IndexableCollectionBuilder<T>(this.kv, this.key)
  }

  /**
   * Initialize a large collection builder.
   *
   * @returns Large Collection Builder.
   */
  largeCollection<const T extends LargeKvValue>() {
    return new LargeCollectionBuilder<T>(this.kv, this.key)
  }
}

/**
 * Builder object for initilaizing a collection.
 */
class CollectionBuilder<const T extends KvValue> {
  private kv: Deno.Kv
  private key: KvKey

  constructor(kv: Deno.Kv, key: KvKey) {
    this.kv = kv
    this.key = key
  }

  /**
   * Build a collection from the set context and given prep definition.
   *
   * @param def - Collection prep definition.
   * @returns A collection instance.
   */
  build(
    def?: CollectionOptions<T>,
  ) {
    return new Collection<T, CollectionOptions<T>>(
      this.kv,
      this.key,
      def ?? {},
    )
  }
}

/**
 * Builder object for initializing an indexable collection.
 */
class IndexableCollectionBuilder<const T extends Model> {
  private kv: Deno.Kv
  private key: KvKey

  constructor(kv: Deno.Kv, key: KvKey) {
    this.kv = kv
    this.key = key
  }

  /**
   * Build an indexable collection from the set context and given prep definition.
   *
   * @param def - Indexable prep definition.
   * @returns An indexable collection instance.
   */
  build<const TDef extends IndexableCollectionOptions<T>>(
    def: TDef,
  ) {
    // Create indexable collection using prep definition
    return new IndexableCollection<T, TDef>(this.kv, this.key, def)
  }
}

/**
 * Builder object for initilaizing a collection.
 */
class LargeCollectionBuilder<const T extends LargeKvValue> {
  private kv: Deno.Kv
  private key: KvKey

  constructor(kv: Deno.Kv, key: KvKey) {
    this.kv = kv
    this.key = key
  }

  /**
   * Build ac collection from the set context and given prep definition.
   *
   * @param def - Collection prep definition.
   * @returns A collection instance.
   */
  build(def?: LargeCollectionOptions<T>) {
    return new LargeCollection<T, LargeCollectionOptions<T>>(
      this.kv,
      this.key,
      def ?? {},
    )
  }
}
