import { AtomicBuilder, type CollectionSelector } from "./atomic_builder.ts"
import { Collection } from "./collection.ts"
import type { KvValue } from "./kvdb.types.ts"

export type Schema = {
  [key: string]: Collection<KvValue> | Schema
}

export type KVDB<TSchema extends Schema> = TSchema & {
  atomic: <const TValue extends KvValue, const TCollection extends Collection<TValue>>(
    selector: CollectionSelector<TSchema, TValue, TCollection>
  ) => AtomicBuilder<TSchema, TValue, TCollection>
}

export function kvdb<const T extends Schema>(schema: T): KVDB<T> {
  const collections = extractCollections(schema)
  const keys = collections.map(collection => collection.collectionKey)
  const validKeys = validateCollectionKeys(keys)

  if (!validKeys) throw Error("Collections must have unique keys")

  return {
    ...schema,
    atomic: selector => new AtomicBuilder(schema, selector(schema))
  }
}

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