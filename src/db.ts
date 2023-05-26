import { AtomicBuilder } from "./atomic_builder.ts"
import type { DB, Schema } from "./types.ts"
import { CollectionBuilder } from "./collection_builder.ts"

/**
 * Create a new database instance.
 *
 * @param kv - The Deno KV instance to be used for storing and retrieving data.
 * @param schemaBuilder - Builder function for building the database schema.
 * @returns
 */
export function createDb<const T extends Schema>(
  kv: Deno.Kv,
  schemaBuilder: (builder: CollectionBuilder) => T,
): DB<T> {
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
