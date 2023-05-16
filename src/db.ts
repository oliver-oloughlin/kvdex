import { AtomicBuilder, type CollectionSelector } from "./atomic_builder.ts"
import { Collection } from "./collection.ts"
import { IndexRecord, IndexableCollection } from "./indexable_collection.ts"
import type { KvKey, KvValue, Model } from "./kvdb.types.ts"

// Types
export type Schema = {
  [key: string]: Collection<KvValue> | Schema
}

export type KVDB<TSchema extends Schema> = TSchema & {
  atomic: <const TValue extends KvValue, const TCollection extends Collection<TValue>>(
    selector: CollectionSelector<TSchema, TValue, TCollection>
  ) => AtomicBuilder<TSchema, TValue, TCollection>
}

// Create KVDB function
export function kvdb<const T extends Schema>(kv: Deno.Kv, schemaBuilder: (builder: CollectionBuilder) => T): KVDB<T> {
  const builder = new CollectionBuilder(kv)
  const schema = schemaBuilder(builder)

  const collections = extractCollections(schema)
  const keys = collections.map(collection => collection.collectionKey)
  const validKeys = validateCollectionKeys(keys)

  if (!validKeys) throw Error("Collections must have unique keys")

  return {
    ...schema,
    atomic: selector => new AtomicBuilder(kv, schema, selector(schema))
  }
}

// Helpers
function extractCollections<const T extends Schema>(schema: T) {
  const collections: Collection<KvValue>[] = []

  Object.values(schema).forEach((schemaOrCollection) => {
    if (schemaOrCollection instanceof Collection) {
      collections.push(schemaOrCollection)
    }
    else {
      collections.push(...extractCollections(schemaOrCollection))
    }
  })

  return collections
}

function validateCollectionKeys(keys: Deno.KvKey[]) {
  const strKeys = keys.map(key => JSON.stringify(key))

  while (strKeys.length > 0) {
    const strKey = strKeys.pop()
    if (strKeys.some(key => key === strKey)) return false
  }

  return true
}

// Collection Builder class
class CollectionBuilder {

  private kv: Deno.Kv

  constructor(kv: Deno.Kv) {
    this.kv = kv
  }

  collection<const T extends KvValue>(collectionKey: KvKey) {
    return new Collection<T>(this.kv, collectionKey)
  }

  indexableCollection<const T extends Model>(collectionKey: KvKey, indexRecord: IndexRecord<T>) {
    return new IndexableCollection(this.kv, collectionKey, indexRecord)
  }

}