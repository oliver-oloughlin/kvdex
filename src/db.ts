import type {
  CollectionOptions,
  CountAllOptions,
  DB,
  DeleteAllOptions,
  Document,
  EnqueueOptions,
  FindOptions,
  KvId,
  KvKey,
  KvValue,
  QueueMessageHandler,
  Schema,
  SchemaDefinition,
} from "./types.ts"
import { Collection } from "./collection.ts"
import {
  allFulfilled,
  extendKey,
  parseQueueMessage,
  prepareEnqueue,
} from "./utils.internal.ts"
import { AtomicBuilder } from "./atomic_builder.ts"
import { KVDEX_KEY_PREFIX, UNDELIVERED_KEY_SUFFIX } from "./constants.ts"

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
    atomic: (selector) => new AtomicBuilder(kv, schema, selector(schema)),
    countAll: async (opts) => await _countAll(kv, schema, opts),
    deleteAll: async (opts) => await _deleteAll(kv, schema, opts),
    enqueue: async (data, opts) => await _enqueue(kv, data, opts),
    listenQueue: async (handler) => await _listenQueue(kv, handler),
    findUndelivered: async (id, opts) => await _findUndelivered(kv, id, opts),
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
async function _enqueue(kv: Deno.Kv, data: KvValue, options?: EnqueueOptions) {
  // Prepare and perform enqueue operation
  const prep = prepareEnqueue(null, data, options)
  return await kv.enqueue(prep.msg, prep.options)
}

/**
 * Listen for data in the database queue.
 *
 * @param kv - Deno KV instance.
 * @param handler - Data handler function.
 */
async function _listenQueue<T extends KvValue>(
  kv: Deno.Kv,
  handler: QueueMessageHandler<T>,
) {
  // Listen for messages in the kv queue
  await kv.listenQueue(async (msg) => {
    // Parse queue message
    const parsed = parseQueueMessage<T>(msg)

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

/**
 * Find an undelivered document entry by id.
 *
 * @param id - Document id.
 * @param options - Find options, optional.
 * @returns Document if found, null if not.
 */
async function _findUndelivered<T extends KvValue = KvValue>(
  kv: Deno.Kv,
  id: KvId,
  options?: FindOptions,
) {
  // Create document key, get document entry
  const key = extendKey([KVDEX_KEY_PREFIX], UNDELIVERED_KEY_SUFFIX, id)
  const result = await kv.get<T>(key, options)

  // If no entry exists, return null
  if (result.value === null || result.versionstamp === null) {
    return null
  }

  // Create the document
  const doc: Document<T> = {
    id,
    versionstamp: result.versionstamp,
    value: result.value,
  }

  // Return the document
  return doc
}
