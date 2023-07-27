import { AtomicBuilder } from "./atomic_builder.ts"
import type {
  CollectionDefinition,
  CountAllOptions,
  DB,
  DeleteAllOptions,
  KvKey,
  KvValue,
  Schema,
  SchemaDefinition,
} from "./types.ts"
import { CollectionInitializer } from "./collection_builder.ts"
import { Collection } from "./collection.ts"
import { extendKey } from "./utils.internal.ts"

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
export function createDb<const T extends SchemaDefinition>(
  kv: Deno.Kv,
  schemaDefinition: T,
): DB<T> {
  const schema = _createSchema(schemaDefinition, kv) as Schema<T>
  return {
    ...schema,
    atomic: (selector) => new AtomicBuilder(kv, schema, selector(schema)),
    countAll: (options) => _countAll(kv, schema, options),
    deleteAll: (options) => _deleteAll(kv, schema, options),
  }
}

function _createSchema<const T extends SchemaDefinition>(
  def: T,
  kv: Deno.Kv,
  treeKey?: KvKey,
): Schema<T> {
  const entries = Object.entries(def)

  const schemaEntries = entries.map(([key, value]) => {
    const extendedKey = treeKey ? extendKey(treeKey, key) : [key] as KvKey
    if (typeof value === "function") {
      const initializer = new CollectionInitializer(kv, extendedKey)
      return [key, value(initializer)]
    }

    return [key, _createSchema(value, kv, extendedKey)]
  })

  const schema = Object.fromEntries(schemaEntries)

  return schema as Schema<T>
}

async function _countAll(
  kv: Deno.Kv,
  schemaOrCollection:
    | Schema<SchemaDefinition>
    | Collection<KvValue, CollectionDefinition<KvValue>>,
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
  schemaOrCollection:
    | Schema<SchemaDefinition>
    | Collection<KvValue, CollectionDefinition<KvValue>>,
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
