import { Collection } from "./collection.ts"
import { IndexableCollection } from "./indexable_collection.ts"
import type { IndexRecord, KvKey, KvValue, Model } from "./types.ts"

// Collection Builder class
export class CollectionBuilder {
  private kv: Deno.Kv
  private collectionKeyStrs: string[]

  constructor(kv: Deno.Kv) {
    this.kv = kv
    this.collectionKeyStrs = []
  }

  /**
   * Create a standard collection of data adhering to the type KvValue.
   * Can be of primitives, like strings and numbers, or arrays and objects.
   *
   * @param collectionKey - A unique KvKey for the collection.
   * @returns
   */
  collection<const T extends KvValue>(collectionKey: KvKey) {
    this.checkCollectionKey(collectionKey)
    return new Collection<T>(this.kv, collectionKey)
  }

  /**
   * Create an indexable collection of data adhering to the type Model.
   * Restricted to holding objects.
   *
   * @param collectionKey - A unique KvKey for the collection.
   * @param indexRecord - A record of fields that the documents should be indexed by.
   * @returns
   */
  indexableCollection<const T extends Model>(
    collectionKey: KvKey,
    indexRecord: IndexRecord<T>,
  ) {
    this.checkCollectionKey(collectionKey)
    return new IndexableCollection<T, typeof indexRecord>(
      this.kv,
      collectionKey,
      indexRecord,
    )
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
