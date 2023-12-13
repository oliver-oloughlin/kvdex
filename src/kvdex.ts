import type {
  AtomicBatchOptions,
  CollectionOptions,
  CollectionSelector,
  CountAllOptions,
  EnqueueOptions,
  FindOptions,
  IntervalMessage,
  KvId,
  KvKey,
  KvValue,
  LoopMessage,
  LoopOptions,
  QueueListenerOptions,
  QueueMessageHandler,
  QueueValue,
  Schema,
  SchemaDefinition,
  SetIntervalOptions,
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
import {
  DEFAULT_INTERVAL,
  DEFAULT_INTERVAL_RETRY,
  DEFAULT_LOOP_RETRY,
  KVDEX_KEY_PREFIX,
  UNDELIVERED_KEY_PREFIX,
} from "./constants.ts"
import { model } from "./model.ts"
import { AtomicWrapper } from "./atomic_wrapper.ts"

/**
 * Create a new database instance.
 *
 * Builds the database collections and forms the schema.
 *
 * @example
 * ```ts
 * import { kvdex, model, collection } from "https://deno.land/x/kvdex/mod.ts"
 *
 * type User = {
 *   username: string
 *   age: number
 * }
 *
 * const kv = await Deno.openKv()
 *
 * const db = kvdex(kv, {
 *   numbers: collection(model<number>()),
 *   u64s: collection(model<Deno.KvU64>()),
 *   serializedStrings: collection(model<string>(), { serialize: "auto" }),
 *   users: collection(model<User>(), {
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
 * @returns A KvDex instance with attached schema.
 */
export function kvdex<const T extends SchemaDefinition>(
  kv: Deno.Kv,
  schemaDefinition: T,
) {
  // Set listener activated flag and queue handlers map
  let listener: Promise<void>
  const queueHandlers = new Map<string, QueueMessageHandler<QueueValue>[]>()

  // Create idempotent listener activator
  const idempotentListener = () => {
    // Create new queue listener if not already created
    if (!listener) {
      // Add queue listener
      listener = kv.listenQueue(async (msg) => {
        // Parse queue message
        const parsed = parseQueueMessage(msg)
        if (!parsed.ok) {
          return
        }

        // Find correct queue handlers
        const { __data__, __handlerId__ } = parsed.msg
        const handlers = queueHandlers.get(__handlerId__)

        // Run queue handlers
        await allFulfilled(handlers?.map((handler) => handler(__data__)) ?? [])
      })
    }

    // Return queue listener
    return listener
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

export class KvDex<const TSchema extends Schema<SchemaDefinition>> {
  private kv: Deno.Kv
  private schema: TSchema
  private queueHandlers: Map<string, QueueMessageHandler<QueueValue>[]>
  private idempotentListener: () => Promise<void>

  constructor(
    kv: Deno.Kv,
    schema: TSchema,
    queueHandlers: Map<string, QueueMessageHandler<QueueValue>[]>,
    idempotentListener: () => Promise<void>,
  ) {
    this.kv = kv
    this.schema = schema
    this.queueHandlers = queueHandlers
    this.idempotentListener = idempotentListener
  }

  /**
   * Initializes an atomic operation.
   *
   * Takes a selector function as argument which is used to select an initial collection context.
   *
   * @example
   * ```ts
   * db.atomic(schema => schema.users)
   * ```
   *
   * @param selector - Collection selector function.
   * @returns A new AtomicBuilder instance.
   */
  atomic<const TInput, const TOutput extends KvValue>(
    selector: CollectionSelector<TSchema, TInput, TOutput>,
  ) {
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
   * await db.deleteAll()
   * ```
   *
   * @example
   * ```ts
   * await db.deleteAll({ atomicBatchSize: 500 })
   * ```
   *
   * @param options - Atomic batch options.
   * @returns Promise resolving to void.
   */
  async deleteAll(options?: AtomicBatchOptions) {
    await _deleteAll(this.kv, this.schema, options)
  }

  /**
   * Wipe all kvdex entries, including undelivered and history entries.
   *
   * @example
   * ```ts
   * await db.wipe()
   * ```
   *
   * @example
   * ```ts
   * await db.wipe({ atomicBatchSize: 500 })
   * ```
   *
   * @param options - Atomic batch options.
   */
  async wipe(options?: AtomicBatchOptions) {
    // Create iterator
    const iter = this.kv.list({ prefix: [KVDEX_KEY_PREFIX] })

    // Collect all kvdex keys
    const keys: Deno.KvKey[] = []
    for await (const { key } of iter) {
      keys.push(key)
    }

    // Delete all entries
    const atomic = new AtomicWrapper(this.kv, options?.atomicBatchSize)
    keys.forEach((key) => atomic.delete(key))
    await atomic.commit()
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
  async enqueue<T extends QueueValue>(data: T, options?: EnqueueOptions) {
    // Prepare and perform enqueue operation
    const prep = prepareEnqueue(
      [KVDEX_KEY_PREFIX],
      [KVDEX_KEY_PREFIX, UNDELIVERED_KEY_PREFIX],
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
    return this.idempotentListener()
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
    return new Document(model<T, T>(), {
      id,
      versionstamp: result.versionstamp,
      value: result.value,
    })
  }

  /**
   * Delete an undelivered document entry by id from the database queue.
   *
   * @example
   * ```ts
   * db.deleteUndelivered("id")
   * ```
   *
   * @param id - Id of undelivered document.
   */
  async deleteUndelivered(id: KvId) {
    const key = extendKey([KVDEX_KEY_PREFIX], UNDELIVERED_KEY_PREFIX, id)
    await this.kv.delete(key)
  }

  /**
   * Create an interval for a callback function to be invoked, built on queues.
   *
   * Interval defaults to 1 hour if not set.
   *
   * Will repeat indefinitely if no exit condition is set.
   *
   * @example
   * ```ts
   * // Will repeat indeefinitely with 1 hour interval
   * db.setInterval("greeting", () => console.log("Hello World!"))
   *
   * // First callback starts after a 10 second delay, after that there is a 5 second delay between callbacks
   * db.setInterval("terminator", () => console.log("I terminate after the 10th run"), {
   *   // 10 second delay before the first job callback invoked
   *   startDelay: 10_000,
   *
   *   // Fixed interval of 5 seconds
   *   interval: 5_000,
   *
   *   // ...or set a dynamic interval
   *   interval: ({ count }) => count * 500,
   *
   *   // Count starts at 0 and is given before the current callback is run
   *   exitOn: ({ count }) => count === 10,
   * })
   * ```
   *
   * @param fn - Callback function.
   * @param options - Set interval options.
   * @returns A listener promise.
   */
  async setInterval(
    fn: (msg: IntervalMessage) => unknown,
    options?: SetIntervalOptions,
  ) {
    // Set id
    const id = crypto.randomUUID()

    // Create interval enqueuer
    const enqueue = async (
      msg: IntervalMessage,
      delay: number | undefined,
    ) => {
      // Try enqueuing until delivered on number of retries is exhausted
      for (let i = 0; i <= (options?.retry ?? DEFAULT_INTERVAL_RETRY); i++) {
        await this.enqueue(msg, {
          idsIfUndelivered: [id],
          delay,
          topic: id,
        })

        // Check if message was delivered, break for-loop if successful
        const doc = await this.findUndelivered(id)

        if (doc === null) {
          break
        }

        // Delete undelivered entry before retrying
        await this.deleteUndelivered(id)
      }
    }

    // Add interval listener
    const listener = this.listenQueue<IntervalMessage>(async (msg) => {
      // Check if exit criteria is met, terminate interval if true
      let exit = false
      try {
        exit = await options?.exitOn?.(msg) ?? false
      } catch (e) {
        console.error(
          `An error was caught while running exitOn task for interval {ID = ${id}}`,
          e,
        )
      }

      if (exit) {
        await options?.onExit?.(msg)
        return
      }

      // Set the next interval
      let interval = DEFAULT_INTERVAL
      try {
        if (typeof options?.interval === "function") {
          interval = await options.interval(msg)
        } else {
          interval = options?.interval ?? DEFAULT_INTERVAL
        }
      } catch (e) {
        console.error(
          `An error was caught while setting the next callback delay for interval {ID = ${id}}`,
          e,
        )
      }

      await allFulfilled([
        // Enqueue next callback
        enqueue({
          count: msg.count + 1,
          interval,
          timestamp: new Date(),
          first: false,
        }, interval),

        // Invoke callback function
        fn(msg),
      ])
    }, { topic: id })

    // Enqueue first task
    await enqueue({
      count: 0,
      interval: options?.startDelay ?? 0,
      timestamp: new Date(),
      first: true,
    }, Math.max(options?.startDelay ?? 0, 200))

    // Return listener
    return listener
  }

  /**
   * Create a sequential loop built on queues.
   *
   * @example
   * ```ts
   * // Prints "Hello World!" 10 times, with 1 second delay
   * db.loop("greeting", () => console.log("Hello World!"), {
   *   delay: 1_000,
   *   exitOn: ({ count }) => count === 10,
   * })
   * ```
   *
   * @param fn - Callback function.
   * @param options - Loop options.
   * @returns - A listener promise.
   */
  async loop<const T1 extends QueueValue>(
    fn: (msg: LoopMessage<Awaited<T1>>) => T1 | Promise<T1>,
    options?: LoopOptions<Awaited<T1>>,
  ) {
    // Set id
    const id = crypto.randomUUID()

    // Create loop enqueuer
    const enqueue = async (
      msg: LoopMessage<Awaited<T1>>,
      delay: number | undefined,
    ) => {
      // Try enqueuing until delivered on number of retries is exhausted
      for (let i = 0; i <= (options?.retry ?? DEFAULT_LOOP_RETRY); i++) {
        await this.enqueue(msg, {
          idsIfUndelivered: [id],
          delay,
          topic: id,
        })

        // Check if message was delivered, break for-loop if successful
        const doc = await this.findUndelivered(id)

        if (doc === null) {
          break
        }

        // Delete undelivered entry before retrying
        await this.deleteUndelivered(id)
      }
    }

    // Add loop listener
    const listener = this.listenQueue<LoopMessage<Awaited<T1>>>(async (msg) => {
      // Check if exit criteria is met, terminate loop if true
      let exit = false
      try {
        exit = await options?.exitOn?.(msg) ?? false
      } catch (e) {
        console.error(
          `An error was caught while running exitOn task for loop {ID = ${id}}`,
          e,
        )
      }

      if (exit) {
        await options?.onExit?.(msg)
        return
      }

      // Set the next delay
      let delay = 0
      try {
        if (typeof options?.delay === "function") {
          delay = await options.delay(msg)
        } else {
          delay = options?.delay ?? 0
        }
      } catch (e) {
        console.error(
          `An error was caught while setting the next callback delay for loop {ID = ${id}}`,
          e,
        )
      }

      // Run task
      const result = await fn(msg)

      // Enqueue next task
      await enqueue({
        count: msg.count + 1,
        result: result as unknown as Awaited<T1>,
        delay: delay,
        timestamp: new Date(),
        first: false,
      }, delay)
    }, { topic: id })

    // Enqueue first task
    await enqueue({
      count: 0,
      result: null,
      delay: options?.startDelay ?? 0,
      timestamp: new Date(),
      first: true,
    }, options?.startDelay)

    // Return listener
    return await listener
  }
}

/*************************/
/*                       */
/*   UTILITY FUNCTIONS   */
/*                       */
/**************************/

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
  idempotentListener: () => Promise<void>,
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
 * @returns Promise resolving to the total count of documents in schema collections or collection.
 */
async function _countAll(
  kv: Deno.Kv,
  schemaOrCollection:
    | Schema<SchemaDefinition>
    | Collection<KvValue, KvValue, CollectionOptions<KvValue>>,
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
    | Collection<KvValue, KvValue, CollectionOptions<KvValue>>,
  options?: AtomicBatchOptions,
): Promise<void> {
  // If input is a collection, perform deleteMany
  if (schemaOrCollection instanceof Collection) {
    await schemaOrCollection.deleteMany(options)
    return
  }

  // Recursively perform delete for all schemas/collections
  await allFulfilled(
    Object.values(schemaOrCollection).map((val) =>
      _deleteAll(kv, val, options)
    ),
  )
}
