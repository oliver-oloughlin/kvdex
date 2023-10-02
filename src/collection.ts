import {
  ID_KEY_PREFIX,
  KVDEX_KEY_PREFIX,
  UNDELIVERED_KEY_PREFIX,
} from "./constants.ts"
import type {
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
  QueueMessageHandler,
  SetOptions,
  UpdateData,
  UpdateManyOptions,
} from "./types.ts"
import {
  allFulfilled,
  createListSelector,
  extendKey,
  generateId,
  getDocumentId,
  isKvObject,
  keyEq,
  kvGetMany,
  parseQueueMessage,
  prepareEnqueue,
} from "./utils.ts"
import { Document } from "./Document.ts"

/**
 * Represents a collection of documents stored in the KV store.
 *
 * Contains methods for working on documents in the collection.
 */
export class Collection<
  const T1 extends KvValue,
  const T2 extends CollectionOptions<T1>,
> {
  protected kv: Deno.Kv
  readonly _idGenerator: IdGenerator<KvValue>
  readonly _keys: CollectionKeys

  /**
   * Create a new collection for handling documents in the KV store.
   *
   * @example
   * ```ts
   * const kv = await Deno.openKv()
   * const numbers = new Collection<number>(kv, ["numbers"])
   * ```
   *
   * @param options - Collection options.
   */
  constructor(kv: Deno.Kv, key: KvKey, options?: T2) {
    // Set the KV instance
    this.kv = kv

    // Set id generator function
    this._idGenerator = options?.idGenerator as IdGenerator<KvValue> ??
      generateId

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
    return new Document<T1>({
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
        new Document<T1>({
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
  async add(data: T1, options?: SetOptions) {
    // Generate id and set the document entry
    const id = this._idGenerator(data)
    return await this.setDocument(id, data, options, false)
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
    await allFulfilled(ids.map(async (id) => {
      const key = extendKey(this._keys.idKey, id)
      await this.kv.delete(key)
    }))
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
    options?: SetOptions,
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
   * @param data - Updated data to be inserted into documents.
   * @param options - Update many options, optional.
   * @returns Promise resolving to an object containing iterator cursor and result list.
   */
  async updateMany(
    data: UpdateData<T1>,
    options?: UpdateManyOptions<T1>,
  ) {
    // Initiate result list
    const result: (CommitResult<T1> | Deno.KvCommitError)[] = []

    // Update each document, add commit result to result list
    const { cursor } = await this.handleMany(async (doc) => {
      const cr = await this.updateDocument(doc, data, options)
      result.push(cr)
    }, options)

    // Return result list and current iterator cursor
    return {
      result,
      cursor,
    }
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
   * @param entries - Data entries to be added.
   * @param options - Set options, optional.
   * @returns A promise that resolves to a list of Deno.KvCommitResult or Deno.KvCommitError objects
   */
  async addMany(entries: T1[], options?: SetOptions) {
    // Add each entry, return commit result list
    return await allFulfilled(entries.map((data) => this.add(data, options)))
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
  async deleteMany(options?: ListOptions<T1>) {
    // Execute delete operation for each document entry
    return await this.handleMany((doc) => this.delete(doc.id), options)
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
    // Initiate result list
    const result: Document<T1>[] = []

    // Add each document entry to result list
    const { cursor } = await this.handleMany(
      (doc) => result.push(doc),
      options,
    )

    // Return result list and current iterator cursor
    return {
      result,
      cursor,
    }
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
    // Execute callback function for each document entry
    return await this.handleMany((doc) => fn(doc), options)
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
  async map<const TMapped>(
    fn: (doc: Document<T1>) => TMapped,
    options?: ListOptions<T1>,
  ) {
    // Initiate result list
    const result: TMapped[] = []

    // Execute callback function for each document entry, add to result list
    const { cursor } = await this.handleMany(
      (doc) => result.push(fn(doc)),
      options,
    )

    // Return result list and current iterator cursor
    return {
      result,
      cursor,
    }
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
    // Initiate count variable, increment for each document entry, return result
    let result = 0
    await this.handleMany(() => result++, options)
    return result
  }

  /**
   * Add data to the collection queue to be delivered to the queue listener
   * via ``db.collection.listenQueue()``. The data will only be received by queue
   * listeners on the specified collection. The method takes an optional options
   * argument that can be used to set a delivery delay.
   *
   * @example
   * ```ts
   * // Immediate delivery
   * await db.users.enqueue("some data")
   *
   * // Delay of 2 seconds before delivery
   * await db.users.enqueue("some data", {
   *   delay: 2_000
   * })
   * ```
   *
   * @param data - Data to be added to the collection queue.
   * @param options - Enqueue options, optional.
   * @returns - Promise resolving to Deno.KvCommitResult.
   */
  async enqueue(data: KvValue, options?: EnqueueOptions) {
    // Prepare and perform enqueue operation
    const prep = prepareEnqueue(this._keys.baseKey, data, options)
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
   * // Sends post request when data is received
   * db.users.listenQueue(async (data) => {
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
  async listenQueue<T extends KvValue = KvValue>(
    handler: QueueMessageHandler<T>,
  ) {
    // Listen for kv queue messages
    await this.kv.listenQueue(async (msg) => {
      // Parse queue message
      const parsed = parseQueueMessage<T>(msg)

      // If failed parse, ignore
      if (!parsed.ok) {
        return
      }

      // Destruct queue message
      const { collectionKey, data } = parsed.msg

      // Check that collection key is set and matches current collection context
      if (
        Array.isArray(collectionKey) &&
        keyEq(collectionKey, this._keys.baseKey)
      ) {
        // Invoke data handler
        await handler(data)
      }
    })
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
    return new Document<T>({
      id,
      versionstamp: result.versionstamp,
      value: result.value,
    })
  }

  /** PROTECTED METHODS */

  /**
   * Perform operations on lists of documents in the collection.
   *
   * @param fn - Callback function.
   * @param options - List options, optional.
   * @returns Promise that resolves to object with iterator cursor.
   */
  protected async handleMany(
    fn: (doc: Document<T1>) => unknown,
    options?: ListOptions<T1>,
  ) {
    // Create list iterator with given options, initiate documents list
    const selector = createListSelector(this._keys.idKey, options)
    const iter = this.kv.list<T1>(selector, options)
    const docs: Document<T1>[] = []

    // Loop over each document entry
    for await (const { key, value, versionstamp } of iter) {
      // Get document id, continue to next entry if undefined
      const id = getDocumentId(key)
      if (typeof id === "undefined") {
        continue
      }

      // Create document
      const doc = new Document<T1>({
        id,
        versionstamp,
        value: value,
      })

      // Filter document and add to documents list
      if (!options?.filter || options.filter(doc)) {
        docs.push(doc)
      }
    }

    // Execute callback function for each document
    await allFulfilled(docs.map((doc) => fn(doc)))

    // Return current iterator cursor
    return {
      cursor: iter.cursor || undefined,
    }
  }

  /**
   * Set a document entry in the KV store.
   *
   * @param id - Document id.
   * @param data - Document value.
   * @param options - Set options or undefined.
   * @param overwrite - Boolean flag determining whether to overwrite existing entry or fail operation.
   * @returns Promise resolving to a CommitResult object.
   */
  protected async setDocument(
    id: KvId,
    data: T1,
    options: SetOptions | undefined,
    overwrite = false,
  ): Promise<CommitResult<T1> | Deno.KvCommitError> {
    // Create document key
    const key = extendKey(this._keys.idKey, id)

    // Create atomic operation with set mutation
    let atomic = this.kv.atomic().set(key, data, options)

    // If overwrite is false, check for existing document
    if (!overwrite) {
      atomic = atomic.check({
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
        id,
        data,
        { ...options, retry: retry - 1 },
        overwrite,
      )
    }

    // return commit result or error
    return cr.ok
      ? {
        ok: true,
        versionstamp: cr.versionstamp,
        id,
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
    options: SetOptions | undefined,
  ) {
    // Get document value, delete document entry
    const { value, id } = doc

    // If value is KvObject, perform partial merge and set new documetn value
    if (isKvObject(value)) {
      return await this.setDocument(
        id,
        {
          ...value as KvObject,
          ...data as KvObject,
        } as T1,
        options,
        true,
      )
    }

    // Set new document value
    return await this.setDocument(id, data as T1, options, true)
  }
}
