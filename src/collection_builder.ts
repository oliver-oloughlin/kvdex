import { Collection } from "./collection.ts"
import { IndexableCollection } from "./indexable_collection.ts"
import type { IndexRecord, KvKey, KvValue, Model } from "./types.ts"

/**
 * Builder object for building new collections of documents.
 */
export class CollectionBuilder {
  private kv: Deno.Kv
  private collectionKeyStrs: string[]

  /**
   * Create a new CollectionBuilder instance for building collections.
   *
   * @param kv - The KV instance that each collection will use.
   */
  constructor(kv: Deno.Kv) {
    this.kv = kv
    this.collectionKeyStrs = []
  }

  /**
   * Create a standard collection of data adhering to the type KvValue.
   * Can be of primitives, like strings and numbers, or arrays and objects.
   *
   * **Example:**
   * ```ts
   * builder.collection<string>(["strings"])
   * ```
   *
   * @param collectionKey - A unique KvKey for the collection.
   * @returns
   */
  collection<const T extends KvValue>(
    collectionKey: KvKey,
  ) {
    this.checkCollectionKey(collectionKey)
    return new Collection<T>(this.kv, collectionKey)
  }

  /**
   * Create an indexable collection of data adhering to the type Model.
   * Restricted to object types.
   *
   * **Example:**
   * ```ts
   * builder.indexableCollection<User>(["users"], {
   *   username: "primary",
   *   age: "secondary"
   * })
   * ```
   *
   * @param collectionKey - A unique KvKey for the collection.
   * @param indexRecord - A record of fields that the documents should be indexed by.
   * @returns
   */
  indexableCollection<const T extends Model>(
    collectionKey: KvKey,
  ) {
    this.checkCollectionKey(collectionKey)
    return new IndexableCollectionBuilder<T>(this.kv, collectionKey)
  }

  private checkCollectionKey(collectionKey: KvKey) {
    const collectionKeyStr = JSON.stringify(collectionKey)

    if (this.collectionKeyStrs.some((keyStr) => keyStr === collectionKeyStr)) {
      throw Error(
        `Collection key "${collectionKeyStr}" has already been assigned another collection.`,
      )
    }

    this.collectionKeyStrs.push(collectionKeyStr)
  }
}

/**
 * Builder object for creating a new IndexableCollection.
 */
class IndexableCollectionBuilder<const T1 extends Model> {
  private kv: Deno.Kv
  private collectionKey: KvKey

  constructor(kv: Deno.Kv, collectionKey: KvKey) {
    this.kv = kv
    this.collectionKey = collectionKey
  }

  /**
   * Sets the indices of an IndexableCollection and returns the
   * collection instance.
   *
   * @param indexRecord - Index record of primary and secondary indices.
   * @returns - A new IndexableCollection instance.
   */
  indices<const T2 extends IndexRecord<T1>>(indexRecord: T2) {
    return new IndexableCollection<T1, T2>(
      this.kv,
      this.collectionKey,
      indexRecord,
    )
  }
}
