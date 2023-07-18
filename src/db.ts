import { AtomicBuilder } from "./atomic_builder.ts"
import type {
  CountAllOptions,
  DB,
  DeleteAllOptions,
  KvValue,
  Schema,
} from "./types.ts"
import { CollectionBuilder } from "./collection_builder.ts"
import { Collection } from "./collection.ts"

/**
 * Create a new database instance.
 *
 * Builds the database collections and checks for duplicate keys.
 * In the case where two collections have the same key, an error will be thrown.
 *
 * **Example:**
 * ```ts
 * interface User extends Model {
 *   username: string
 *   age: number
 * }
 *
 * const kv = await Deno.openKv()
 *
 * const db = createDb(kv, (builder) => ({
 *   numbers: builder.collection<number>(["numbers"]),
 *   users: builder.indexableCollection<User>(["users"]).indices({
 *     username: "primary",
 *     age: "secondary"
 *   })
 * }))
 * ```
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
    atomic: (selector) => new AtomicBuilder(kv, schema, selector(schema)),
    countAll: (options) => _countAll(kv, schema, options),
    deleteAll: (options) => _deleteAll(kv, schema, options),
  }
}

async function _countAll(
  kv: Deno.Kv,
  schemaOrCollection: Schema | Collection<KvValue>,
  options?: CountAllOptions,
): Promise<number> {
  if (schemaOrCollection instanceof Collection) {
    return await schemaOrCollection.count(options)
  }

  const counts = await Promise.all(
    Object.values(schemaOrCollection).map((val) => _countAll(kv, val, options)),
  )

  return counts.reduce((sum, c) => sum + c, 0)
}

async function _deleteAll(
  kv: Deno.Kv,
  schemaOrCollection: Schema | Collection<KvValue>,
  options?: DeleteAllOptions,
) {
  if (schemaOrCollection instanceof Collection) {
    await schemaOrCollection.deleteMany(options)
    return
  }

  await Promise.all(
    Object.values(schemaOrCollection).map((val) =>
      _deleteAll(kv, val, options)
    ),
  )
}
