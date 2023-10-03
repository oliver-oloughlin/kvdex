import type {
  CollectionOptions,
  CollectionSelector,
  CountAllOptions,
  DeleteAllOptions,
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
import { Document } from "./document.ts"
import {
  allFulfilled,
  extendKey,
  parseQueueMessage,
  prepareEnqueue,
} from "./utils.ts"
import { AtomicBuilder } from "./atomic_builder.ts"
import { KVDEX_KEY_PREFIX, UNDELIVERED_KEY_PREFIX } from "./constants.ts"

/**
 * Create a new database instance.
 *
 * Builds the database collections and forms the schema.
 *
 * @example
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
) {
  const schema = _createSchema(schemaDefinition, kv) as Schema<T>
  const db = new KvDex(kv, schema)
  return Object.assign(db, schema)
}

export class KvDex<const T extends Schema<SchemaDefinition>> {
  private kv: Deno.Kv
  private schema: T

  constructor(kv: Deno.Kv, schema: T) {
    this.kv = kv
    this.schema = schema
  }

  /**
   * Initiates an atomic operation.
   * Takes a selector function as argument which is used to select an initial collection.
   *
   * @example
   * ```ts
   * db.atomic(schema => schema.users)
   * ```
   *
   * @param selector - Collection selector function.
   * @returns A new AtomicBuilder instance.
   */
  atomic<const T1 extends KvValue>(selector: CollectionSelector<T, T1>) {
    return new AtomicBuilder(this.kv, this.schema, selector(this.schema))
  }

  /**
   * Count all document entries in the KV store.
   *
   * @example
   * ```ts
   * // Returns the total number of documents in the KV store across all collections
   * const count = await db.countAll()
   * ```
   *
   * @param options - Count all options, optional.
   * @returns Promise resolving to a number representing the total count of documents in the KV store.
   */
  async countAll(options?: CountAllOptions) {
    return await _countAll(this.kv, this.schema, options)
  }

  /**
   * Delete all document entries in the KV store.
   *
   * @example
   * ```ts
   * // Deletes all documents across all collections
   * await db.deleteAll()
   * ```
   * @param options - Delete all options, optional.
   * @returns Promise resolving to void.
   */
  async deleteAll(options?: DeleteAllOptions) {
    return await _deleteAll(this.kv, this.schema, options)
  }

  /**
   * Add data to the database queue to be delivered to the queue listener
   * via ``db.listenQueue()``. The data will only be received by queue
   * listeners on the database queue. The method takes an optional options
   * argument that can be used to set a delivery delay.
   *
   * @example
   * ```ts
   * // Immediate delivery
   * await db.enqueue("some data")
   *
   * // Delay of 2 seconds before delivery
   * await db.enqueue("some data", {
   *   delay: 2_000
   * })
   * ```
   *
   * @param data - Data to be added to the database queue.
   * @param options - Enqueue options, optional.
   */
  async enqueue(data: KvValue, options?: EnqueueOptions) {
    return await _enqueue(this.kv, data, options)
  }

  /**
   * Listen for data from the database queue that was enqueued with ``db.enqueue()``. Will only receive data that was enqueued to the database queue. Takes a handler function as argument.
   *
   * @example
   * ```ts
   * // Prints the data to console when recevied
   * db.listenQueue((data) => console.log(data))
   *
   * // Sends post request when data is received
   * db.listenQueue(async (data) => {
   *   const dataBody = JSON.stringify(data)
   *
   *   const res = await fetch("...", {
   *     method: "POST",
   *     body: dataBody
   *   })
   *
   *   console.log("POSTED:", dataBody, res.ok)
   * })
   * ```
   *
   * @param handler - Message handler function.
   */
  async listenQueue(handler: QueueMessageHandler<KvValue>) {
    return await _listenQueue(this.kv, handler)
  }

  /**
   * Find an undelivered document entry by id from the database queue.
   *
   * @example
   * ```ts
   * const doc1 = await db.findUndelivered("undelivered_id")
   *
   * const doc2 = await db.findUndelivered("undelivered_id", {
   *   consistency: "eventual", // "strong" by default
   * })
   * ```
   *
   * @param id - Document id.
   * @param options - Find options, optional.
   * @returns Document if found, null if not.
   */
  async findUndelivered(id: KvId, options?: FindOptions) {
    return await _findUndelivered(this.kv, id, options)
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
  const key = extendKey([KVDEX_KEY_PREFIX], UNDELIVERED_KEY_PREFIX, id)
  const result = await kv.get<T>(key, options)

  // If no entry exists, return null
  if (result.value === null || result.versionstamp === null) {
    return null
  }

  // Return document
  return new Document<T>({
    id,
    versionstamp: result.versionstamp,
    value: result.value,
  })
}
