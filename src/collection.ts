import {
  DEFAULT_MERGE_TYPE,
  ID_KEY_PREFIX,
  KVDEX_KEY_PREFIX,
  UNDELIVERED_KEY_PREFIX,
} from "./constants.ts"
import type {
  AtomicListOptions,
  CollectionKeys,
  CollectionOptions,
  CommitResult,
  CountOptions,
  EnqueueOptions,
  FindManyOptions,
  FindOptions,
  IdGenerator,
  KvId,
  KvKey,
  KvObject,
  KvValue,
  ListOptions,
  Model,
  QueueListenerOptions,
  QueueMessageHandler,
  QueueValue,
  SetOptions,
  UpdateData,
  UpdateManyOptions,
  UpdateOptions,
} from "./types.ts"
import {
  allFulfilled,
  createHandlerId,
  createListSelector,
  deepMerge,
  extendKey,
  generateId,
  getDocumentId,
  isKvObject,
  kvGetMany,
  prepareEnqueue,
  selectsAll,
} from "./utils.ts"
import { Document } from "./document.ts"
import { model } from "./model.ts"
import { AtomicWrapper } from "./atomic_wrapper.ts"

/**
 * Create a collection builder function.
 *
 * @example
 * ```ts
 * collection(model<number>(), {
 *   idGenerator: () => ulid()
 * })
 * ```
 *
 * @param model - Model.
 * @param options - Collection options.
 * @returns A collection builder function.
 */
export function collection<const T1 extends KvValue>(
  model: Model<T1>,
  options?: CollectionOptions<T1>,
) {
  return (
    kv: Deno.Kv,
    key: KvKey,
    queueHandlers: Map<string, QueueMessageHandler<QueueValue>[]>,
    idempotentListener: () => Promise<void>,
  ) =>
    new Collection<T1, CollectionOptions<T1>>(
      kv,
      key,
      model,
      queueHandlers,
      idempotentListener,
      options,
    )
}

/**
 * Represents a collection of documents stored in the KV store.
 *
 * Contains methods for working on documents in the collection.
 */
export class Collection<
  const T1 extends KvValue,
  const T2 extends CollectionOptions<T1>,
> {
  private queueHandlers: Map<string, QueueMessageHandler<QueueValue>[]>
  private idempotentListener: () => Promise<void>

  protected kv: Deno.Kv

  readonly _idGenerator: IdGenerator<KvValue>
  readonly _keys: CollectionKeys
  readonly _model: Model<T1>

  constructor(
    kv: Deno.Kv,
    key: KvKey,
    model: Model<T1>,
    queueHandlers: Map<string, QueueMessageHandler<QueueValue>[]>,
    idempotentListener: () => Promise<void>,
    options?: T2,
  ) {
    // Set reference to queue handlers and idempotent listener
    this.queueHandlers = queueHandlers
    this.idempotentListener = idempotentListener

    // Set the KV instance
    this.kv = kv

    // Set id generator function
    this._idGenerator = options?.idGenerator as IdGenerator<KvValue> ??
      generateId

    // Set model
    this._model = model

    // Set the collection keys
    this._keys = {
      baseKey: extendKey([KVDEX_KEY_PREFIX], ...key),
      idKey: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        ID_KEY_PREFIX,
      ),
    }
  }

  /**
   * Finds a document with the given id in the KV store.
   *
   * @example
   * ```ts
   * const userDoc1 = await db.users.find("user1")
   *
   * const userDoc2 = await db.users.find("user2", {
   *   consistency: "eventual" // "strong" by default
   * })
   * ```
   *
   * @param id - Id of the document to find.
   * @param options - Find options, optional.
   * @returns A promise that resolves to the found document, or null if not found.
   */
  async find(id: KvId, options?: FindOptions) {
    // Create document key, get document entry
    const key = extendKey(this._keys.idKey, id)
    const result = await this.kv.get<T1>(key, options)

    // If no entry exists, return null
    if (result.value === null || result.versionstamp === null) {
      return null
    }

    // Return document
    return new Document<T1>(this._model, {
      id,
      versionstamp: result.versionstamp,
      value: result.value,
    })
  }

  /**
   * Finds multiple documents with the given array of ids in the KV store.
   *
   * @example
   * ```ts
   * const userDocs1 = await db.users.findMany(["user1", "user2", "user3"])
   *
   * const userDocs2 = await db.users.findMany(["user1", "user2", "user3"], {
   *   consistency: "eventual" // "strong" by default
   * })
   * ```
   *
   * @param ids - Array of ids of the documents to be found.
   * @param options - Find many options, optional.
   * @returns A promise that resolves to an array of documents.
   */
  async findMany(ids: KvId[], options?: FindManyOptions) {
    // Create document keys, get document entries
    const keys = ids.map((id) => extendKey(this._keys.idKey, id))
    const entries = await kvGetMany<T1>(keys, this.kv, options)

    // Create empty result list
    const result: Document<T1>[] = []

    // Loop over entries, add to result list
    for (const { key, versionstamp, value } of entries) {
      // Get the document id
      const id = getDocumentId(key)

      // If no id, or empty entry, then continue to next entry
      if (
        typeof id === "undefined" || versionstamp === null || value === null
      ) {
        continue
      }

      // Add document to result list
      result.push(
        new Document<T1>(this._model, {
          id,
          versionstamp,
          value,
        }),
      )
    }

    // Return result list
    return result
  }

  /**
   * Adds a new document to the KV store with a randomely generated id.
   *
   * @example
   * ```ts
   * const result = await db.users.add({
   *   username: "oli",
   *   age: 24
   * })
   * ```
   *
   * @param data - Document value.
   * @param options - Set options, optional.
   * @returns Promise resolving to a CommitResult object.
   */
  async add(value: T1, options?: SetOptions) {
    // Set document value with generated id
    return await this.setDocument(null, value, options, false)
  }

  /**
   * Adds a new document with the given id to the KV store.
   *
   * @example
   * ```ts
   * const result = await db.users.set("oliver", {
   *   username: "oli",
   *   age: 24
   * })
   * ```
   *
   * @param id - Document id.
   * @param data - Document value.
   * @param options - Set options, optional.
   * @returns Promise resolving to a CommitResult object.
   */
  async set(id: KvId, data: T1, options?: SetOptions) {
    return await this.setDocument(id, data, options, false)
  }

  /**
   * Write a document to the KV store.
   *
   * Sets a new document entry if no matching id already exists, overwrites the exisiting entry if it exists.
   *
   * Does not overwrite existing entries if there is a primary index collision.
   *
   * @example
   * ```ts
   * const result = await db.users.write("anders", {
   *   username: "andy",
   *   age: 24
   * })
   * ```
   * @param id - Document id.
   * @param value - Document value.
   * @param options - Set options, optional.
   * @returns Promise resolving to a CommitResult object.
   */
  async write(id: KvId, value: T1, options?: SetOptions) {
    return await this.setDocument(id, value, options, true)
  }

  /**
   * Deletes one or more documents with the given ids from the KV store.
   *
   * @example
   * ```ts
   * await db.users.delete("oliver")
   *
   * await db.users.delete("user1", "user2", "user3")
   * ```
   * @param ids - IDs of documents to be deleted.
   * @returns A promise that resovles to void.
   */
  async delete(...ids: KvId[]) {
    // Perform delete operation for each id
    const atomic = new AtomicWrapper(this.kv, 40)
    ids.forEach((id) => atomic.delete(extendKey(this._keys.idKey, id)))
    await atomic.commit()
  }

  /**
   * Updates a document with the given id in the KV store.
   *
   * For primitive values, arrays and built-in objects,
   * this method overrides the old value with the new one.
   *
   * For custom object types, this method merges the
   * new data with the exisiting data.
   *
   * @example
   * ```ts
   * const result1 = await db.numbers.update("num1", 10)
   *
   * const result2 = await db.users.update("oliver", {
   *   age: 30 // Partial update, only updates the age field
   * })
   * ```
   *
   * @param id - Id of document to be updated
   * @param data - Updated data to be inserted into document
   * @param options - Set options, optional.
   * @returns
   */
  async update(
    id: KvId,
    data: UpdateData<T1>,
    options?: UpdateOptions,
  ): Promise<CommitResult<T1> | Deno.KvCommitError> {
    // Get document
    const doc = await this.find(id)

    // If no document is found, return commit error
    if (!doc) {
      return {
        ok: false,
      }
    }

    // Update document and return commit result
    return await this.updateDocument(doc, data, options)
  }

  /**
   * Update the value of multiple existing documents in the collection.
   *
   * @example
   * ```ts
   * // Updates all user documents and sets name = 67
   * await db.users.updateMany({ age: 67 })
   *
   * // Updates all user documents where the user's age is above 20
   * await db.users.updateMany({ age: 67 }, {
   *   filter: (doc) => doc.value.age > 20,
   * })
   *
   * // Only updates first user document, as username is a primary index
   * const { result } = await db.users.updateMany({ username: "XuserX" })
   *
   * const success = result.every(commitResult => commitResult.ok)
   * console.log(success) // false
   * ```
   *
   * @param value - Updated value to be inserted into documents.
   * @param options - Update many options, optional.
   * @returns Promise resolving to an object containing iterator cursor and result list.
   */
  async updateMany(
    value: UpdateData<T1>,
    options?: UpdateManyOptions<T1>,
  ) {
    // Update each document, add commit result to result list
    return await this.handleMany(
      this._keys.idKey,
      (doc) => this.updateDocument(doc, value, options),
      options,
    )
  }

  /**
   * Adds multiple documents to the KV store.
   *
   * @example
   * ```ts
   * // Adds 5 new document entries to the KV store.
   * await results = await db.numbers.addMany([1, 2, 3, 4, 5])
   *
   * // Only adds the first entry, as "username" is defined as a primary index and cannot have duplicates
   * await results = await db.users.addMany([
   *   {
   *     username: "oli",
   *     age: 24
   *   },
   *   {
   *     username: "oli",
   *     age: 56
   *   }
   * ])
   * ```
   *
   * @param values - Document values to be added.
   * @param options - Set options, optional.
   * @returns A promise that resolves to a list of Deno.KvCommitResult or Deno.KvCommitError objects
   */
  async addMany(values: T1[], options?: SetOptions) {
    // Initiate result and error lists
    const results: (CommitResult<T1> | Deno.KvCommitError)[] = []
    const errors: unknown[] = []

    // Add each value
    await allFulfilled(
      values.map(async (value) => {
        try {
          const result = await this.add(value, options)
          results.push(result)
        } catch (e) {
          errors.push(e)
        }
      }),
    )

    // Throw any caught errors
    if (errors.length > 0) {
      throw errors
    }

    // If a commit has failed, return commit error
    if (!results.every((cr) => cr.ok)) {
      return { ok: false }
    }

    // Return commit result
    return {
      ok: true,
      versionstamp: "0",
    }
  }

  /**
   * Deletes multiple documents from the KV store according to the given options.
   *
   * If no options are given, all documents are deleted.
   *
   * @example
   * ```ts
   * // Delete all
   * await db.users.deleteMany()
   *
   * // Delete only users with username = "oli"
   * await db.users.deleteMany({
   *   filter: doc => doc.value.username === "oli"
   * })
   * ```
   *
   * @param options - List options, optional.
   * @returns A promise that resovles to an object containing the iterator cursor
   */
  async deleteMany(options?: AtomicListOptions<T1>) {
    // Perform quick delete if all documents are to be deleted
    if (selectsAll(options)) {
      // Create list iterator and empty keys list
      const iter = this.kv.list({ prefix: this._keys.baseKey }, options)
      const keys: Deno.KvKey[] = []

      // Collect all collection entry keys
      for await (const { key } of iter) {
        keys.push(key)
      }

      // Delete all keys and return
      const atomic = new AtomicWrapper(this.kv, options?.atomicBatchSize)
      keys.forEach((key) => atomic.delete(key))
      await atomic.commit()
    }

    // Execute delete operation for each document entry
    const { cursor } = await this.handleMany(
      this._keys.idKey,
      (doc) => this.delete(doc.id),
      options,
    )

    return { cursor }
  }

  /**
   * Retrieves multiple documents from the KV store according to the given options.
   *
   * If no options are given, all documents are retrieved.
   *
   * @example
   * ```ts
   * // Get all users
   * const { result } = await db.users.getMany()
   *
   * // Only get users with username that starts with "a"
   * const { result } = await db.users.getMany({
   *   filter: doc => doc.value.username.startsWith("a")
   * })
   * ```
   *
   * @param options - List options, optional.
   * @returns A promise that resovles to an object containing a list of the retrieved documents and the iterator cursor
   */
  async getMany(options?: ListOptions<T1>) {
    // Get each document, return result list and current iterator cursor
    return await this.handleMany(
      this._keys.idKey,
      (doc) => doc,
      options,
    )
  }

  /**
   * Executes a callback function for every document according to the given options.
   *
   * If no options are given, the callback function is executed for all documents in the collection.
   *
   * @example
   * ```ts
   * // Print all usernames
   * await db.users.forEach(doc => console.log(doc.value.username))
   *
   * // Print all usernames of users with age < 18
   * await db.users.forEach(doc => console.log(doc.value.username), {
   *   filter: doc => doc.value.age < 18
   * })
   * ```
   *
   * @param fn - Callback function.
   * @param options - List options, optional.
   * @returns A promise that resovles to an object containing the iterator cursor
   */
  async forEach(fn: (doc: Document<T1>) => void, options?: ListOptions<T1>) {
    // Execute callback function for each document entry and return cursor
    const { cursor } = await this.handleMany(
      this._keys.idKey,
      (doc) => fn(doc),
      options,
    )

    return { cursor }
  }

  /**
   * Executes a callback function for every document according to the given options.
   *
   * If no options are given, the callback function is executed for all documents in the collection.
   *
   * The results from the callback function are returned as a list.
   *
   * @example
   * ```ts
   * // Maps from all user documents to a list of all user document ids
   * const { result } = await db.users.map(doc => doc.id)
   *
   * // Maps from users with age > 20 to a list of usernames
   * const { result } = await db.users.map(doc => doc.value.username, {
   *   filter: doc => doc.value.age > 20
   * })
   * ```
   *
   * @param fn - Callback function.
   * @param options - List options, optional.
   * @returns A promise that resovles to an object containing a list of the callback results and the iterator cursor
   */
  async map<const T>(
    fn: (doc: Document<T1>) => T,
    options?: ListOptions<T1>,
  ) {
    // Execute callback function for each document entry, return result and cursor
    return await this.handleMany(
      this._keys.idKey,
      (doc) => fn(doc),
      options,
    )
  }

  /**
   * Counts the number of documents in the collection.
   *
   * @example
   * ```ts
   * // Returns the total number of user documents in the KV store
   * const count = await db.users.count()
   *
   * // Returns the number of users with age > 20
   * const count = await db.users.count({
   *   filter: doc => doc.value.age > 20
   * })
   * ```
   *
   * @param options - Count options, optional.
   * @returns A promise that resolves to a number representing the performed count.
   */
  async count(options?: CountOptions<T1>) {
    // Initiate count result
    let result = 0

    // Perform efficient count if counting all document entries
    if (selectsAll(options)) {
      const iter = this.kv.list({ prefix: this._keys.idKey }, options)
      for await (const _ of iter) {
        result++
      }
      return result
    }

    // Perform count using many documents handler
    await this.handleMany(this._keys.idKey, () => result++, options)
    return result
  }

  /**
   * Add data to the collection queue to be delivered to the queue listener
   * via ``db.collection.listenQueue()``. The data will only be received by queue
   * listeners on the specified collection and topic. The method takes an optional options
   * argument that can be used to set a delivery delay and topic.
   *
   * @example
   * ```ts
   * // Immediate delivery
   * await db.users.enqueue("some data")
   *
   * // Delay of 2 seconds before delivery, sent to the "food" topic
   * await db.users.enqueue("cake", {
   *   delay: 2_000,
   *   topic: "food"
   * })
   * ```
   *
   * @param data - Data to be added to the collection queue.
   * @param options - Enqueue options, optional.
   * @returns - Promise resolving to Deno.KvCommitResult.
   */
  async enqueue<T extends QueueValue>(data: T, options?: EnqueueOptions) {
    // Prepare message and options for enqueue
    const prep = prepareEnqueue(
      this._keys.baseKey,
      data,
      options,
    )

    // Enqueue message with options
    return await this.kv.enqueue(prep.msg, prep.options)
  }

  /**
   * Listen for data from the collection queue that was enqueued with ``db.collection.enqueue()``.
   * Will only receive data that was enqueued to the specific collection queue.
   * Takes a handler function as argument.
   *
   * @example
   * ```ts
   * // Prints the data to console when recevied
   * db.users.listenQueue((data) => console.log(data))
   *
   * // Sends post request when data is received in the "posts" topic
   * db.users.listenQueue(async (data) => {
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
   * @returns void.
   */
  async listenQueue<T extends QueueValue = QueueValue>(
    handler: QueueMessageHandler<T>,
    options?: QueueListenerOptions,
  ) {
    // Create handler id
    const handlerId = createHandlerId(this._keys.baseKey, options?.topic)

    // Add new handler to specified handlers
    const handlers = this.queueHandlers.get(handlerId) ?? []
    handlers.push(handler as QueueMessageHandler<QueueValue>)
    this.queueHandlers.set(handlerId, handlers)

    // Activate idempotent listener
    return await this.idempotentListener()
  }

  /**
   * Find an undelivered document entry by id from the collection queue.
   *
   * @example
   * ```ts
   * const doc1 = await db.users.findUndelivered("undelivered_id")
   *
   * const doc2 = await db.users.findUndelivered("undelivered_id", {
   *   consistency: "eventual", // "strong" by default
   * })
   * ```
   *
   * @param id - Document id.
   * @param options - Find options, optional.
   * @returns Document if found, null if not.
   */
  async findUndelivered<T extends KvValue = KvValue>(
    id: KvId,
    options?: FindOptions,
  ) {
    // Create document key, get document entry
    const key = extendKey(this._keys.baseKey, UNDELIVERED_KEY_PREFIX, id)
    const result = await this.kv.get<T>(key, options)

    // If no entry exists, return null
    if (result.value === null || result.versionstamp === null) {
      return null
    }

    // Return document
    return new Document<T>(model(), {
      id,
      versionstamp: result.versionstamp,
      value: result.value,
    })
  }

  /**
   * Delete an undelivered document entry by id from the collection queue.
   *
   * @example
   * ```ts
   * db.users.deleteUndelivered("id")
   * ```
   *
   * @param id - Id of undelivered document.
   */
  async deleteUndelivered(id: KvId) {
    const key = extendKey(this._keys.baseKey, UNDELIVERED_KEY_PREFIX, id)
    await this.kv.delete(key)
  }

  /** PROTECTED METHODS */

  /**
   * Perform operations on lists of documents in the collection.
   *
   * @param prefixKey - Prefix key for list selector.
   * @param fn - Callback function.
   * @param options - List options, optional.
   * @returns Promise that resolves to object with iterator cursor.
   */
  protected async handleMany<const T>(
    prefixKey: KvKey,
    fn: (doc: Document<T1>) => T,
    options: ListOptions<T1> | undefined,
  ) {
    // Create list iterator with given options
    const selector = createListSelector(prefixKey, options)
    const iter = this.kv.list<T1>(selector, options)

    // Initiate lists
    const docs: Document<T1>[] = []
    const result: Awaited<T>[] = []
    const errors: unknown[] = []

    // Loop over each document entry
    for await (const { key, value, versionstamp } of iter) {
      // Get document id, continue to next entry if undefined
      const id = getDocumentId(key)
      if (typeof id === "undefined") {
        continue
      }

      // Create document
      const doc = new Document<T1>(this._model, {
        id,
        versionstamp,
        value: value,
      })

      // Filter document and add to documents list
      const filter = options?.filter
      if (!filter || filter(doc)) {
        docs.push(doc)
      }
    }

    // Execute callback function for each document
    await allFulfilled(docs.map(async (doc) => {
      try {
        const res = await fn(doc)
        result.push(res)
      } catch (e) {
        errors.push(e)
      }
    }))

    // Throw any caught errors
    if (errors.length > 0) {
      throw errors
    }

    // Return result and current iterator cursor
    return {
      result,
      cursor: iter.cursor || undefined,
    }
  }

  /**
   * Set a document entry in the KV store.
   *
   * @param id - Document id.
   * @param value - Document value.
   * @param options - Set options or undefined.
   * @param overwrite - Boolean flag determining whether to overwrite existing entry or fail operation.
   * @returns Promise resolving to a CommitResult object.
   */
  protected async setDocument(
    id: KvId | null,
    value: T1,
    options: SetOptions | undefined,
    overwrite = false,
  ): Promise<CommitResult<T1> | Deno.KvCommitError> {
    // Create id, document key and parse document value
    const parsed = this._model.parse(value)
    const docId = id ?? this._idGenerator(parsed)
    const key = extendKey(this._keys.idKey, docId)

    // Create atomic operation with set mutation
    const atomic = this.kv.atomic().set(key, parsed, options)

    // If overwrite is false, check for existing document
    if (!overwrite) {
      atomic.check({
        key,
        versionstamp: null,
      })
    }

    // Perform atomic operation
    const cr = await atomic.commit()

    // Retry failed operation if remaining attempts
    const retry = options?.retry ?? 0
    if (!cr.ok && retry > 0) {
      return await this.setDocument(
        docId,
        parsed,
        { ...options, retry: retry - 1 },
        overwrite,
      )
    }

    // return commit result or error
    return cr.ok
      ? {
        ok: true,
        versionstamp: cr.versionstamp,
        id: docId,
      }
      : {
        ok: false,
      }
  }

  /**
   * Update a document with new data.
   *
   * @param doc - Old document.
   * @param data - New data.
   * @param options - Set options or undefined.
   * @returns Promise that resolves to a commit result.
   */
  protected async updateDocument(
    doc: Document<T1>,
    data: UpdateData<T1>,
    options: UpdateOptions | undefined,
  ) {
    // Get document value, delete document entry
    const { value, id } = doc

    // If value is KvObject, perform partial merge and set new document value
    if (isKvObject(value)) {
      // Merge value and data according to given merge type
      const mergeType = options?.mergeType ?? DEFAULT_MERGE_TYPE

      const merged = mergeType === "shallow"
        ? {
          ...value as KvObject,
          ...data as KvObject,
        } as T1
        : deepMerge(value, data)

      // Set new document value
      return await this.setDocument(id, merged, options, true)
    }

    // Set new document value
    return await this.setDocument(id, data as T1, options, true)
  }
}
