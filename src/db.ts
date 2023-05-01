import { AtomicBuilder, type CollectionSelector } from "./atomic_builder.ts"
import type { Collection } from "./collection.ts"
import type { KvValue } from "./kvdb.types.ts"

export type Schema = {
  [key: string]: Collection<KvValue> | Schema
}

export type KVDB<T extends Schema> = T & {
  atomic: <const Value extends KvValue>(selector: CollectionSelector<T, Value>) => AtomicBuilder<T, Value>
}

export function kvdb<T extends Schema>(schema: T): KVDB<T> {
  return {
    ...schema,
    atomic: selector => new AtomicBuilder(schema, selector(schema))
  }
}