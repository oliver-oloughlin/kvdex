import type {
  CollectionOptions,
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
import { Collection } from "./collection.ts"
import { allFulfilled, extendKey, parseQueueMessage } from "./utils.internal.ts"
import { createAtomicBuilder } from "./atomic_builder.ts"

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
 *   numbers: collection<number>().build(),
 *   u64s: collection<Deno.KvU64>().build(),
 *   largeStrings: largeCollection<string>().build(),
 *   users: indexableCollection<User>().build({
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
    atomic: (selector) => createAtomicBuilder(kv, schema, selector),
    countAll: async (options) => await _countAll(kv, schema, options),
    deleteAll: async (options) => await _deleteAll(kv, schema, options),
    enqueue: async (data, options) => await _enqueue(kv, data, options),
    listenQueue: async (handler) => await _listenQueue(kv, handler),
  }
}

/**
 * Create a database schema from schema definition.
 *
 * @param def - Schema definition.
 * @param kv - Deno KV instance.
 * @param treeKey - The current tree key.
 * @returns
 */
function _createSchema<const T extends SchemaDefinition>(
  def: T,
  kv: Deno.Kv,
  treeKey?: KvKey,
): Schema<T> {
  // Get all the definition entries
  const entries = Object.entries(def)

  // Create schema entries from schema definition entries
  const schemaEntries = entries.map(([key, value]) => {
    // Get the current tree key
    const extendedKey = treeKey ? extendKey(treeKey, key) : [key] as KvKey

    // If the entry value is a function => build collection and create collection entry
    if (typeof value === "function") {
      return [key, value(kv, extendedKey)]
    }

    // Create and return schema entry
    return [key, _createSchema(value, kv, extendedKey)]
  })

  // Create schema object from schema entries
  const schema = Object.fromEntries(schemaEntries)

  // Return the built schema object
  return schema as Schema<T>
}

/**
 * Count all documents in the KV store.
 *
 * @param kv - Deno KV instance.
 * @param schemaOrCollection - Schema or Collection object.
 * @param options - CountAll options.
 * @returns Promise resolving to void the total count of documents in schema collections or collection.
 */
async function _countAll(
  kv: Deno.Kv,
  schemaOrCollection:
    | Schema<SchemaDefinition>
    | Collection<KvValue, CollectionOptions<KvValue>>,
  options?: CountAllOptions,
): Promise<number> {
  // If input is a collection, return the collection count
  if (schemaOrCollection instanceof Collection) {
    return await schemaOrCollection.count(options)
  }

  // Recursively count the schema collections.
  const counts = await allFulfilled(
    Object.values(schemaOrCollection).map((val) => _countAll(kv, val, options)),
  )

  // Return the sum of collection counts
  return counts.reduce((sum, c) => sum + c, 0)
}

/**
 * Delete all documents in the KV store.
 *
 * @param kv - Deno KV instance.
 * @param schemaOrCollection - Schema or Collection object.
 * @param options - DeleteAll options.
 * @returns Promise resolving to void.
 */
async function _deleteAll(
  kv: Deno.Kv,
  schemaOrCollection:
    | Schema<SchemaDefinition>
    | Collection<KvValue, CollectionOptions<KvValue>>,
  options?: DeleteAllOptions,
) {
  // If input is a collection, delete all documents in the collection
  if (schemaOrCollection instanceof Collection) {
    await schemaOrCollection.deleteMany(options)
    return
  }

  // Recursively delete all documents from schema collections
  await allFulfilled(
    Object.values(schemaOrCollection).map((val) =>
      _deleteAll(kv, val, options)
    ),
  )
}

/**
 * Enqueue data in the database queue.
 *
 * @param kv - Deno KV instance.
 * @param data - Data to be enqueued.
 * @param options - Enqueue options.
 * @returns Promise resolving to void.
 */
async function _enqueue(kv: Deno.Kv, data: unknown, options?: EnqueueOptions) {
  // Create a queue message without collection key
  const msg: QueueMessage = {
    collectionKey: null,
    data,
  }

  // Enqueue the queue message with the kv instance
  return await kv.enqueue(msg, options)
}

/**
 * Listen for data in the database queue.
 *
 * @param kv - Deno KV instance.
 * @param handler - Data handler function.
 */
async function _listenQueue(kv: Deno.Kv, handler: QueueMessageHandler) {
  // Listen for messages in the kv queue
  await kv.listenQueue(async (msg) => {
    // Parse queue message
    const parsed = parseQueueMessage(msg)

    // If failed parse, ignore
    if (!parsed.ok) {
      return
    }

    // Destruct queue message
    const { collectionKey, data } = parsed.msg

    // If no collection key, invoke the handler for database queue data.
    if (!collectionKey) {
      await handler(data)
    }
  })
}
