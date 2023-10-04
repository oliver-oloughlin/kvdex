import type {
  CollectionOptions,
  CollectionSelector,
  CountAllOptions,
  CronMessage,
  CronOptions,
  DeleteAllOptions,
  EnqueueOptions,
  FindOptions,
  KvId,
  KvKey,
  KvValue,
  QueueListenerOptions,
  QueueMessageHandler,
  QueueValue,
  Schema,
  SchemaDefinition,
} from "./types.ts"
import { Collection } from "./collection.ts"
import { Document } from "./document.ts"
import {
  allFulfilled,
  createHandlerId,
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
  // Set listener activated flag and queue handlers map
  let listenerIsActivated = false
  const queueHandlers = new Map<string, QueueMessageHandler<QueueValue>[]>()

  // Create idempotent listener activator
  const idempotentListener = () => {
    // If listener is already activated, cancel
    if (listenerIsActivated) {
      return
    }

    // Set listener activated flag
    listenerIsActivated = true

    // Add queue listener
    kv.listenQueue(async (msg) => {
      const parsed = parseQueueMessage(msg)
      if (!parsed.ok) {
        return
      }

      const { __data__, __handlerId__ } = parsed.msg
      const handlers = queueHandlers.get(__handlerId__)

      await allFulfilled(handlers?.map((handler) => handler(__data__)) ?? [])
    })
  }

  // Create schema
  const schema = _createSchema(
    schemaDefinition,
    kv,
    queueHandlers,
    idempotentListener,
  ) as Schema<T>

  // Create KvDex object
  const db = new KvDex(kv, schema, queueHandlers, idempotentListener)

  // Return schema and db combination
  return Object.assign(db, schema)
}

export class KvDex<const T extends Schema<SchemaDefinition>> {
  private kv: Deno.Kv
  private schema: T
  private queueHandlers: Map<string, QueueMessageHandler<QueueValue>[]>
  private idempotentListener: () => void

  constructor(
    kv: Deno.Kv,
    schema: T,
    queueHandlers: Map<string, QueueMessageHandler<QueueValue>[]>,
    idempotentListener: () => void,
  ) {
    this.kv = kv
    this.schema = schema
    this.queueHandlers = queueHandlers
    this.idempotentListener = idempotentListener
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
   * Does not count index entries or segmented entries as additional documents.
   *
   * Does not count undelivered queue messages.
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
   * listeners on the database queue and specified topic. The method takes an optional options
   * argument that can be used to set a delivery delay and topic.
   *
   * @example
   * ```ts
   * // Immediate delivery
   * await db.enqueue("some data")
   *
   * // Delay of 2 seconds before delivery
   * await db.enqueue("cake", {
   *   delay: 2_000,
   *  topic: "food"
   * })
   * ```
   *
   * @param data - Data to be added to the database queue.
   * @param options - Enqueue options, optional.
   */
  async enqueue(data: QueueValue, options?: EnqueueOptions) {
    // Prepare and perform enqueue operation
    const prep = prepareEnqueue(
      [KVDEX_KEY_PREFIX],
      data,
      options,
    )

    return await this.kv.enqueue(prep.msg, prep.options)
  }

  /**
   * Listen for data from the database queue that was enqueued with ``db.enqueue()``. Will only receive data that was enqueued to the database queue. Takes a handler function as argument.
   *
   * @example
   * ```ts
   * // Prints the data to console when recevied
   * db.listenQueue((data) => console.log(data))
   *
   * // Sends post request when data is received in the "posts" topic
   * db.listenQueue(async (data) => {
   *   const dataBody = JSON.stringify(data)
   *
   *   const res = await fetch("...", {
   *     method: "POST",
   *     body: dataBody
   *   })
   *
   *   console.log("POSTED:", dataBody, res.ok)
   * }, { topic: "posts" })
   * ```
   *
   * @param handler - Message handler function.
   * @param options - Queue listener options.
   */
  listenQueue<const T extends QueueValue>(
    handler: QueueMessageHandler<T>,
    options?: QueueListenerOptions,
  ) {
    // Create handler id
    const handlerId = createHandlerId([KVDEX_KEY_PREFIX], options?.topic)

    // Add new handler to specified handlers
    const handlers = this.queueHandlers.get(handlerId) ?? []
    handlers.push(handler as QueueMessageHandler<QueueValue>)
    this.queueHandlers.set(handlerId, handlers)

    // Activate idempotent listener
    this.idempotentListener()
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
  async findUndelivered<const T extends KvValue>(
    id: KvId,
    options?: FindOptions,
  ) {
    // Create document key, get document entry
    const key = extendKey([KVDEX_KEY_PREFIX], UNDELIVERED_KEY_PREFIX, id)
    const result = await this.kv.get<T>(key, options)

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

  /**
   * Create a cron job that will repeat at a given interval.
   *
   * If no interval is set the next job will start immediately after the previous has finished.
   *
   * Will repeat indefinitely if no exit predicate is set.
   *
   * @example
   * ```ts
   * // Will repeat indeefinitely without delay
   * db.cron(() => console.log("Hello World!"))
   *
   * // First job starts with a 10 second delay, after that there is a 5 second delay between jobs
   * // Will terminate after the 10th run (count starts at 0), or if the job returns n < 0.25
   * db.cron(() => Math.random(), {
   *   startDelay: 10_000,
   *   interval: 5_000,
   *   exit: ({ count, result }) => count >= 9 || result < 0.25,
   * })
   * ```
   *
   * @param job - Work that will be run for each job interval.
   * @param options - Cron options.
   */
  async cron<T1>(
    job: () => T1,
    options?: CronOptions<Awaited<T1>>,
  ) {
    // Create cron handler id
    const id = crypto.randomUUID()

    // Create cron job enqueuer
    const enqueue = async (
      cronMsg: CronMessage,
      delay: number | undefined,
    ) => {
      // Enqueue cron job until delivered
      for (let i = 0; i < (options?.retries ?? 10); i++) {
        await this.enqueue(cronMsg, {
          idsIfUndelivered: [id],
          delay,
          topic: id,
        })

        // Check if message was delivered, break loop if successful
        const doc = await this.findUndelivered(id)

        if (doc === null) {
          break
        }
      }
    }

    // Add cron job listener
    this.listenQueue<CronMessage>(async (msg) => {
      // Run cron job
      const result = await job()

      // Check if exit criteria is met, end repeating cron job if true
      const exit = await options?.exitOn?.(
        { count: msg.count, result },
      ) ?? false

      if (exit) {
        return
      }

      // Set the next interval
      const interval = options?.setInterval
        ? await options?.setInterval!({ count: msg.count, result })
        : options?.interval

      // Enqueue next cron job
      await enqueue({
        count: msg.count + 1,
      }, interval)
    }, { topic: id })

    // Enqueue first cron job
    await enqueue({
      count: 0,
    }, options?.startDelay)
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
  queueHandlers: Map<string, QueueMessageHandler<QueueValue>[]>,
  idempotentListener: () => void,
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
      return [key, value(kv, extendedKey, queueHandlers, idempotentListener)]
    }

    // Create and return schema entry
    return [
      key,
      _createSchema(value, kv, queueHandlers, idempotentListener, extendedKey),
    ]
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
