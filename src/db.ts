import { AtomicBuilder, type CollectionSelector } from "./atomic_builder.ts"
import { Collection } from "./collection.ts"
import {
  IndexableCollection,
  type IndexRecord,
} from "./indexable_collection.ts"
import type { KvKey, KvValue, Model } from "./kvdb.types.ts"

// Types
export type Schema = {
  [key: string]: Collection<KvValue> | Schema
}

export type KVDB<TSchema extends Schema> = TSchema & {
  atomic: <
    const TValue extends KvValue,
    const TCollection extends Collection<TValue>,
  >(
    selector: CollectionSelector<TSchema, TValue, TCollection>,
  ) => AtomicBuilder<TSchema, TValue, TCollection>
}

/**
 * Create a new database instance.
 *
 * @param kv - The Deno KV instance to be used for storing and retrieving data.
 * @param schemaBuilder - Builder function for building the database schema.
 * @returns
 */
export function kvdb<const T extends Schema>(
  kv: Deno.Kv,
  schemaBuilder: (builder: CollectionBuilder) => T,
): KVDB<T> {
  const builder = new CollectionBuilder(kv)
  const schema = schemaBuilder(builder)

  return {
    ...schema,
    /**
     * Initiates an atomic operation.
     * Takes a selector function as argument which is used to select an initial collection.
     *
     * @param selector - Collection selector function.
     * @returns - Commit object.
     */
    atomic: (selector) => new AtomicBuilder(kv, schema, selector(schema)),
  }
}

// Collection Builder class
class CollectionBuilder {
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
