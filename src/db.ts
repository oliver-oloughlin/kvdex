import { AtomicBuilder } from "./atomic_builder.ts"
import type {
  CollectionDefinition,
  CountAllOptions,
  DB,
  DeleteAllOptions,
  EnqueueOptions,
  KvKey,
  KvValue,
  QueueMessage,
  QueueMessageHandler,
  Schema,
  SchemaDefinition,
} from "./types.ts"
import { CollectionBuilderContext } from "./collection_builder.ts"
import { Collection } from "./collection.ts"
import { extendKey } from "./utils.internal.ts"

/**
 * Create a new database instance.
 *
 * Builds the database collections and forms the schema.
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
 * const db = kvdex(kv, {
 *   numbers: (ctx) => ctx.collection<number>().build(),
 *   u64s: (ctx) => ctx.collection<Deno.KvU64>().build(),
 *   users: (ctx) => ctx.indexableCollection<User>().build({
 *     indices: {
 *       username: "primary",
 *       age: "secondary"
 *     }
 *   })
 * })
 * ```
 *
 * @param kv - The Deno KV instance to be used for storing and retrieving data.
 * @param schemaDefinition - The schema definition used to build collections and create the database schema.
 * @returns
 */
export function kvdex<const T extends SchemaDefinition>(
  kv: Deno.Kv,
  schemaDefinition: T,
): DB<T> {
  const schema = _createSchema(schemaDefinition, kv) as Schema<T>
  return {
    ...schema,
    atomic: (selector) => new AtomicBuilder(kv, schema, selector(schema)),
    countAll: async (options) => await _countAll(kv, schema, options),
    deleteAll: async (options) => await _deleteAll(kv, schema, options),
    enqueue: async (data, options) => await _enqueue(kv, data, options),
    listenQueue: async (handler) => await _listenQueue(kv, handler),
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
      const initializer = new CollectionBuilderContext(kv, extendedKey)
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

async function _enqueue(kv: Deno.Kv, data: unknown, options?: EnqueueOptions) {
  const msg: QueueMessage = {
    collectionKey: null,
    data,
  }

  return await kv.enqueue(msg, options)
}

async function _listenQueue(kv: Deno.Kv, handler: QueueMessageHandler) {
  await kv.listenQueue(async (msg) => {
    const { collectionKey, data } = msg as QueueMessage

    if (!collectionKey) {
      await handler(data)
    }
  })
}
