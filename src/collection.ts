import type {
  AtomicListOptions,
  CheckKeyOf,
  CollectionKeys,
  CollectionOptions,
  CommitResult,
  CountOptions,
  EnqueueOptions,
  FindManyOptions,
  FindOptions,
  IdempotentListener,
  IdGenerator,
  IndexDataEntry,
  KvId,
  KvKey,
  KvObject,
  KvValue,
  ListOptions,
  ManyCommitResult,
  Model,
  ParseInputType,
  PossibleCollectionOptions,
  PrimaryIndexKeys,
  QueueHandlers,
  QueueListenerOptions,
  QueueMessageHandler,
  QueueValue,
  SecondaryIndexKeys,
  Serialization,
  SerializedEntry,
  SetOptions,
  UpdateData,
  UpdateManyOptions,
  UpdateOptions,
} from "./types.ts"
import {
  allFulfilled,
  checkIndices,
  compress,
  createHandlerId,
  createListSelector,
  decompress,
  deepMerge,
  deleteIndices,
  deserialize,
  extendKey,
  generateId,
  getDocumentId,
  isKvObject,
  kvGetMany,
  prepareEnqueue,
  selectsAll,
  serialize,
  setIndices,
} from "./utils.ts"
import {
  DEFAULT_MERGE_TYPE,
  ID_KEY_PREFIX,
  KVDEX_KEY_PREFIX,
  PRIMARY_INDEX_KEY_PREFIX,
  SECONDARY_INDEX_KEY_PREFIX,
  SEGMENT_KEY_PREFIX,
  UINT8ARRAY_LENGTH_LIMIT,
  UNDELIVERED_KEY_PREFIX,
} from "./constants.ts"
import { AtomicWrapper } from "./atomic_wrapper.ts"
import { Document } from "./document.ts"
import { model } from "./model.ts"

/**
 * Create a new collection within a database context.
 *
 * @example
 * ```ts
 * import { model, collection, kvdex } from "https://deno.land/x/kvdex/mod.ts"
 *
 * type User = {
 *   username: string
 *   age: number
 * }
 *
 * const db = kvdex(kv, {
 *   numbers: collection(model<number>()),
 *   users: collection(model<User>(), {
 *     idGenerator: () => crypto.randomUUID(),
 *     serialized: true,
 *     indices: {
 *       username: "primary",
 *       age: "secondary"
 *     }
 *   })
 * })
 * ```
 *
 * @param model - Collection model.
 * @param options - Collection options.
 * @returns A collection builder function.
 */
export function collection<
  const TInput,
  const TOutput extends KvValue,
  const TOptions extends CollectionOptions<TOutput>,
>(
  model: Model<TInput, TOutput>,
  options?: TOptions,
) {
  return (
    kv: Deno.Kv,
    key: KvKey,
    queueHandlers: QueueHandlers,
    idempotentListener: IdempotentListener,
  ) =>
    new Collection<TInput, TOutput, TOptions>(
      kv,
      key,
      queueHandlers,
      idempotentListener,
      model,
      options,
    )
}

export class Collection<
  const TInput,
  const TOutput extends KvValue,
  const TOptions extends CollectionOptions<TOutput>,
> {
  private kv: Deno.Kv
  private queueHandlers: QueueHandlers
  private idempotentListener: IdempotentListener
  private serialization?: Serialization

  readonly _model: Model<TInput, TOutput>
  readonly _primaryIndexList: string[]
  readonly _secondaryIndexList: string[]
  readonly _keys: CollectionKeys
  readonly _idGenerator: IdGenerator<TOutput>
  readonly _isIndexable: boolean
  readonly _isSerialized: boolean

  constructor(
    kv: Deno.Kv,
    key: KvKey,
    queueHandlers: QueueHandlers,
    idempotentListener: IdempotentListener,
    model: Model<TInput, TOutput>,
    options?: TOptions,
  ) {
    // Set basic fields
    this.kv = kv
    this.queueHandlers = queueHandlers
    this.idempotentListener = idempotentListener
    this._model = model
    this._idGenerator = options?.idGenerator ?? generateId

    // Set keys
    this._keys = {
      base: extendKey([KVDEX_KEY_PREFIX], ...key),
      id: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        ID_KEY_PREFIX,
      ),
      primaryIndex: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        PRIMARY_INDEX_KEY_PREFIX,
      ),
      secondaryIndex: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        SECONDARY_INDEX_KEY_PREFIX,
      ),
      segment: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        SEGMENT_KEY_PREFIX,
      ),
      undelivered: extendKey(
        [KVDEX_KEY_PREFIX],
        UNDELIVERED_KEY_PREFIX,
        ...key,
      ),
    }

    // Check all possible options
    const opts = (options ?? {}) as PossibleCollectionOptions

    // Set index lists
    this._primaryIndexList = []
    this._secondaryIndexList = []

    Object.entries(opts?.indices ?? {}).forEach(([index, value]) => {
      if (value === "primary") {
        this._primaryIndexList.push(index)
      } else {
        this._secondaryIndexList.push(index)
      }
    })

    // Set serialization
    if (opts?.serialized === true) {
      this.serialization = {
        serialize,
        deserialize,
        compress,
        decompress,
      }
    }

    if (typeof opts?.serialized === "object") {
      this.serialization = {
        serialize,
        deserialize,
        compress,
        decompress,
        ...opts?.serialized,
      }
    }

    // Set isIndexable flag
    this._isIndexable = this._primaryIndexList.length > 0 ||
      this._secondaryIndexList.length > 0

    // Set isSerialized flag
    this._isSerialized = !!this.serialization
  }

  /*********************/
  /*                   */
  /*   PUBLIC METHODS  */
  /*                   */
  /*********************/

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
    const key = extendKey(this._keys.id, id)
    const entry = await this.kv.get(key, options)
    return await this.constructDocument(entry)
  }

  /**
   * Find a document by a primary index.
   *
   * @example
   * ```ts
   * // Finds a user document with the username = "oliver"
   * const userDoc = await db.users.findByPrimaryIndex("username", "oliver")
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param options - Find options, optional.
   * @returns A promise resolving to the document found by selected index, or null if not found.
   */
  async findByPrimaryIndex<
    const K extends PrimaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    options?: FindOptions,
  ) {
    // Serialize and compress index value
    const serialized = serialize(value)
    const compressed = compress(serialized)

    // Create the index key
    const key = extendKey(
      this._keys.primaryIndex,
      index as KvId,
      compressed,
    )

    // Get index entry
    const entry = await this.kv.get(key, options)

    // Return constructed document
    return await this.constructDocument(entry)
  }

  /**
   * Find documents by a secondary index. Secondary indices are not
   * unique, and therefore the result is an array of documents.
   * The method takes an optional options argument that can be used for filtering of documents, and pagination.
   *
   * @example
   * ```ts
   * // Returns all users with age = 24
   * const { result } = await db.users.findBySecondaryIndex("age", 24)
   *
   * // Returns all users with age = 24 AND username that starts with "o"
   * const { result } = await db.users.findBySecondaryIndex("age", 24, {
   *   filter: (doc) => doc.value.username.startsWith("o")
   * })
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param options - List options, optional.
   * @returns A promise resolving to an object containing the result list and iterator cursor.
   */
  async findBySecondaryIndex<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(index: K, value: CheckKeyOf<K, TOutput>, options?: ListOptions<TOutput>) {
    // Serialize and compress index value
    const serialized = serialize(value)
    const compressed = compress(serialized)

    // Create prefix key
    const prefixKey = extendKey(
      this._keys.secondaryIndex,
      index as KvId,
      compressed,
    )

    // Add documents to result list by secondary index
    return await this.handleMany(
      prefixKey,
      (doc) => doc,
      options,
    )
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
    const keys = ids.map((id) => extendKey(this._keys.id, id))
    const entries = await kvGetMany(keys, this.kv, options)

    // Create empty result list
    const result: Document<TOutput>[] = []

    // Loop over entries, add to result list
    for (const entry of entries) {
      const doc = await this.constructDocument(entry)

      if (!doc) {
        continue
      }

      result.push(doc)
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
  async add(value: ParseInputType<TInput, TOutput>, options?: SetOptions) {
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
  async set(
    id: KvId,
    data: ParseInputType<TInput, TOutput>,
    options?: SetOptions,
  ) {
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
  async write(
    id: KvId,
    value: ParseInputType<TInput, TOutput>,
    options?: SetOptions,
  ) {
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
    if (this._isIndexable && this._isSerialized) {
      // Run delete operations for each id
      await allFulfilled(ids.map(async (id) => {
        // Create document id key, get entry and construct document
        const idKey = extendKey(this._keys.id, id)
        const entry = await this.kv.get<SerializedEntry>(idKey)
        const doc = await this.constructDocument(entry)

        // Create atomic operation and delete all document entries
        const atomic = new AtomicWrapper(this.kv)
        atomic.delete(idKey)

        // Delete document entries
        if (entry.value) {
          const keys = entry.value.ids.map((segId) =>
            extendKey(this._keys.segment, id, segId)
          )

          keys.forEach((key) => atomic.delete(key))
        }

        // Delete indices
        if (doc) {
          deleteIndices(id, doc.value as KvObject, atomic, this)
        }

        // Commit delete operations
        await atomic.commit()
      }))

      return
    }

    if (this._isIndexable) {
      // Run delete operations for each id
      await allFulfilled(ids.map(async (id) => {
        // Create idKey, get document value
        const idKey = extendKey(this._keys.id, id)
        const { value } = await this.kv.get<KvObject>(idKey)

        // If no value, abort delete
        if (!value) {
          return
        }

        // Perform delete using atomic operation
        const atomic = new AtomicWrapper(this.kv)
        atomic.delete(idKey)
        deleteIndices(id, value, atomic, this)
        await atomic.commit()
      }))

      return
    }

    if (this._isSerialized) {
      // Perform delete for each id
      await allFulfilled(ids.map(async (id) => {
        // Create document id key, get document value
        const idKey = extendKey(this._keys.id, id)
        const { value } = await this.kv.get<SerializedEntry>(idKey)

        // If no value, abort delete
        if (!value) {
          return
        }

        // Create atomic operation and delete all document entries
        const atomic = new AtomicWrapper(this.kv)
        atomic.delete(idKey)

        const keys = value.ids.map((segId) =>
          extendKey(this._keys.segment, id, segId)
        )

        keys.forEach((key) => atomic.delete(key))

        // Commit the operation
        await atomic.commit()
      }))

      return
    }

    // Perform delete operation for each id
    const atomic = new AtomicWrapper(this.kv)
    ids.forEach((id) => atomic.delete(extendKey(this._keys.id, id)))
    await atomic.commit()
  }

  /**
   * Delete a document by a primary index.
   *
   * @example
   * ```ts
   * // Deletes user with username = "oliver"
   * await db.users.deleteByPrimaryIndex("username", "oliver")
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param options - Find options, optional.
   * @returns A promise that resolves to void.
   */
  async deleteByPrimaryIndex<
    const K extends PrimaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    options?: FindOptions,
  ) {
    // Serialize and compress index value
    const serialized = serialize(value)
    const compressed = compress(serialized)

    // Create index key
    const key = extendKey(
      this._keys.primaryIndex,
      index as KvId,
      compressed,
    )

    // Get index entry
    const result = await this.kv.get<
      unknown & Pick<IndexDataEntry<KvObject>, "__id__">
    >(key, options)

    // If no value, abort delete
    if (result.value === null || result.versionstamp === null) {
      return
    }

    // Extract document id from index entry
    const { __id__ } = result.value

    // Delete document by id
    await this.delete(__id__)
  }

  /**
   * Delete documents by a secondary index. The method takes an optional options argument that can be used for filtering of documents, and pagination.
   *
   * @example
   * ```ts
   * // Deletes all users with age = 24
   * await db.users.deleteBySecondaryIndex("age", 24)
   *
   * // Deletes all users with age = 24 AND username that starts with "o"
   * await db.users.deleteBySecondaryIndex("age", 24, {
   *   filter: (doc) => doc.value.username.startsWith("o")
   * })
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param options - List options, optional.
   * @returns A promise that resolves to void.
   */
  async deleteBySecondaryIndex<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(index: K, value: CheckKeyOf<K, TOutput>, options?: ListOptions<TOutput>) {
    // Serialize and compress index value
    const serialized = serialize(value)
    const compressed = compress(serialized)

    // Create prefix key
    const prefixKey = extendKey(
      this._keys.secondaryIndex,
      index as KvId,
      compressed,
    )

    // Delete documents by secondary index, return iterator cursor
    const { cursor } = await this.handleMany(
      prefixKey,
      (doc) => this.delete(doc.id),
      options,
    )

    // Return iterator cursor
    return { cursor }
  }

  /**
   * Updates a document with the given id in the KV store.
   *
   * For primitive values, arrays and built-in objects,
   * this method overrides the old value with the new one.
   *
   * For custom object types, this method merges the
   * new data with the exisiting data using shallow merge
   * by default, or optionally using deep merge.
   *
   * @example
   * ```ts
   * // Updates by overriding the existing value
   * const resulTOutput = await db.numbers.update("num1", 10)
   *
   * // Partial update using deep merge, only updates the age field
   * const resulTInput = await db.users.update("oliver", {
   *   age: 30
   * }, {
   *   mergeType: "deep"
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
    data: UpdateData<TOutput>,
    options?: UpdateOptions,
  ): Promise<CommitResult<TOutput> | Deno.KvCommitError> {
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
   * Update a document by a primary index.
   *
   * @example
   * ```ts
   * // Updates a user with username = "oliver" to have age = 56
   * const result = await db.users.updateByPrimaryIndex("username", "oliver", { age: 56 })
   *
   * // Updates a user document using deep merge
   * const result = await db.users.updateByPrimaryIndex("username", "anders", {
   *   age: 89,
   * }, {
   *   mergeType: "deep",
   * })
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param data - Update data to be inserted into document.
   * @param options - Set options, optional.
   * @returns Promise that resolves to a commit result.
   */
  async updateByPrimaryIndex<
    const K extends PrimaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    data: UpdateData<TOutput>,
    options?: UpdateOptions,
  ): Promise<CommitResult<TOutput> | Deno.KvCommitError> {
    // Find document by primary index
    const doc = await this.findByPrimaryIndex(index, value)

    // If no document, return commit error
    if (!doc) {
      return {
        ok: false,
      }
    }

    // Update document, return result
    return await this.update(doc.id, data, options)
  }

  /**
   * Update documents in the collection by a secondary index.
   *
   * @example
   * ```ts
   * // Updates all user documents with age = 24 and sets age = 67
   * const { result } = await db.users.updateBySecondaryIndex("age", 24, { age: 67 })
   *
   * // Updates all user documents where the user's age is 24 and username starts with "o" using deep merge
   * const { result } = await db.users.updateBySecondaryIndex(
   *   "age",
   *   24,
   *   { age: 67 },
   *   {
   *     filter: (doc) => doc.value.username.startsWith("o"),
   *     mergeType: "deep",
   *   }
   * )
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param data - Update data to be inserted into document.
   * @param options - Update many options, optional.
   * @returns Promise that resolves to an object containing result list and iterator cursor.
   */
  async updateBySecondaryIndex<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    data: UpdateData<TOutput>,
    options?: UpdateManyOptions<TOutput>,
  ) {
    // Serialize and compress index value
    const serialized = serialize(value)
    const compressed = compress(serialized)

    // Create prefix key
    const prefixKey = extendKey(
      this._keys.secondaryIndex,
      index as KvId,
      compressed,
    )

    // Update each document by secondary index, add commit result to result list
    return await this.handleMany(
      prefixKey,
      (doc) => this.updateDocument(doc, data, options),
      options,
    )
  }

  /**
   * Update the value of multiple existing documents in the collection.
   *
   * @example
   * ```ts
   * // Updates all user documents and sets name = 67
   * await db.users.updateMany({ age: 67 })
   *
   * // Updates all user documents using deep merge where the user's age is above 20
   * await db.users.updateMany({ age: 67 }, {
   *   filter: (doc) => doc.value.age > 20,
   *   mergeType: "deep"
   * })
   *
   * // Only updates first user document, as username is a primary index
   * await db.users.updateMany({ username: "XuserX" })
   * ```
   *
   * @param value - Updated value to be inserted into documents.
   * @param options - Update many options, optional.
   * @returns Promise resolving to an object containing iterator cursor and result list.
   */
  async updateMany(
    value: UpdateData<TOutput>,
    options?: UpdateManyOptions<TOutput>,
  ) {
    // Update each document, add commit result to result list
    return await this.handleMany(
      this._keys.id,
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
  async addMany(
    values: ParseInputType<TInput, TOutput>[],
    options?: SetOptions,
  ): Promise<ManyCommitResult | Deno.KvCommitError> {
    // Initiate result and error lists
    const results: (CommitResult<TOutput> | Deno.KvCommitError)[] = []
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
  async deleteMany(options?: AtomicListOptions<TOutput>) {
    // Perform quick delete if all documents are to be deleted
    if (selectsAll(options)) {
      // Create list iterator and empty keys list
      const iter = this.kv.list({ prefix: this._keys.base }, options)
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
      this._keys.id,
      (doc) => this.delete(doc.id),
      options,
    )

    // Return iterator cursor
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
  async getMany(options?: ListOptions<TOutput>) {
    // Get each document, return result list and current iterator cursor
    return await this.handleMany(
      this._keys.id,
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
  async forEach(
    fn: (doc: Document<TOutput>) => unknown,
    options?: ListOptions<TOutput>,
  ) {
    // Execute callback function for each document entry
    const { cursor } = await this.handleMany(
      this._keys.id,
      async (doc) => await fn(doc),
      options,
    )

    // Return iterator cursor
    return { cursor }
  }

  /**
   * Executes a callback function for every document by a secondary index and according to the given options.
   *
   * If no options are given, the callback function is executed for all documents matching the index.
   *
   * @example
   * ```ts
   * // Prints the username of all users where age = 20
   * await db.users.forEachBySecondaryIndex(
   *   "age",
   *   20,
   *   (doc) => console.log(doc.value.username),
   * )
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param fn - Callback function.
   * @param options - List options, optional.
   * @returns A promise that resovles to an object containing the iterator cursor.
   */
  async forEachBySecondaryIndex<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    fn: (doc: Document<TOutput>) => unknown,
    options?: UpdateManyOptions<TOutput>,
  ) {
    // Serialize and compress index value
    const serialized = serialize(value)
    const compressed = compress(serialized)

    // Create prefix key
    const prefixKey = extendKey(
      this._keys.secondaryIndex,
      index as KvId,
      compressed,
    )

    // Execute callback function for each document entry
    const { cursor } = await this.handleMany(
      prefixKey,
      (doc) => fn(doc),
      options,
    )

    // Return iterator cursor
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
    fn: (doc: Document<TOutput>) => T,
    options?: ListOptions<TOutput>,
  ) {
    // Execute callback function for each document entry, return result and cursor
    return await this.handleMany(
      this._keys.id,
      (doc) => fn(doc),
      options,
    )
  }

  /**
   * Executes a callback function for every document by a secondary index and according to the given options.
   *
   * If no options are given, the callback function is executed for all documents matching the index.
   *
   * The results from the callback function are returned as a list.
   *
   * @example
   * ```ts
   * // Returns a list of usernames of all users where age = 20
   * const { result } = await db.users.mapBySecondaryIndex(
   *   "age",
   *   20,
   *   (doc) => doc.value.username,
   * )
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param fn - Callback function.
   * @param options - List options, optional.
   * @returns A promise that resovles to an object containing a list of the callback results and the iterator cursor.
   */
  async mapBySecondaryIndex<
    const T,
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    fn: (doc: Document<TOutput>) => T,
    options?: UpdateManyOptions<TOutput>,
  ) {
    // Serialize and compress index value
    const serialized = serialize(value)
    const compressed = compress(serialized)

    // Create prefix key
    const prefixKey = extendKey(
      this._keys.secondaryIndex,
      index as KvId,
      compressed,
    )

    // Execute callback function for each document entry, return result and cursor
    return await this.handleMany(
      prefixKey,
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
   * @returns A promise that resolves to a number representing the count.
   */
  async count(options?: CountOptions<TOutput>) {
    // Initiate count result
    let result = 0

    // Perform efficient count if counting all document entries
    if (selectsAll(options)) {
      const iter = this.kv.list({ prefix: this._keys.id }, options)
      for await (const _ of iter) {
        result++
      }
      return result
    }

    // Perform count using many documents handler
    await this.handleMany(this._keys.id, () => result++, options)
    return result
  }

  /**
   * Counts the number of documents in the collection by a secondary index.
   *
   * @example
   *
   * ```ts
   * // Counts all users where age = 20
   * const count = await db.users.countBySecondaryIndex("age", 20)
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param options - Count options.
   * @returns A promise that resolves to a number representing the count.
   */
  async countBySecondaryIndex<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    options?: CountOptions<TOutput>,
  ) {
    // Serialize and compress index value
    const serialized = serialize(value)
    const compressed = compress(serialized)

    // Create prefix key
    const prefixKey = extendKey(
      this._keys.secondaryIndex,
      index as KvId,
      compressed,
    )

    // Initialize count result
    let result = 0

    // Update each document by secondary index, add commit result to result list
    await this.handleMany(
      prefixKey,
      () => result++,
      options,
    )

    // Return count result
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
      this._keys.base,
      this._keys.undelivered,
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
    const handlerId = createHandlerId(this._keys.base, options?.topic)

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
    const key = extendKey(this._keys.undelivered, id)
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
    const key = extendKey(this._keys.undelivered, id)
    await this.kv.delete(key)
  }

  /**********************/
  /*                    */
  /*   PRIVATE METHODS  */
  /*                    */
  /**********************/

  /**
   * Set a document entry in the KV store.
   *
   * @param id - Document id.
   * @param value - Document value.
   * @param options - Set options or undefined.
   * @param overwrite - Boolean flag determining whether to overwrite existing entry or fail operation.
   * @returns Promise resolving to a CommitResult object.
   */
  private async setDocument(
    id: KvId | null,
    value: ParseInputType<TInput, TOutput>,
    options: SetOptions | undefined,
    overwrite: boolean,
  ): Promise<CommitResult<TOutput> | Deno.KvCommitError> {
    // Create id, document key and parse document value
    const parsed = this._model.parse(value as TInput)
    const docId = id ?? this._idGenerator(parsed)
    const idKey = extendKey(this._keys.id, docId)
    return await this.setDoc(docId, idKey, parsed, options, overwrite)
  }

  async setDoc(
    docId: KvId,
    idKey: KvKey,
    value: TOutput,
    options: SetOptions | undefined,
    overwrite = false,
  ): Promise<CommitResult<TOutput> | Deno.KvCommitError> {
    // Check for id collision
    const idCheck = await this.kv
      .atomic()
      .check({
        key: idKey,
        versionstamp: null,
      })
      .commit()

    if (!idCheck.ok) {
      // If overwrite is false, return commit error
      if (!overwrite) {
        return {
          ok: false,
        }
      }

      // If overwrite is true, delete existing document entry
      await this.delete(docId)
    }

    // Initialize atomic operation and keys list
    const atomic = new AtomicWrapper(this.kv, options?.atomicBatchSize)
    const keys: KvKey[] = []
    let docValue: any = value

    // Serialize if enabled
    if (this._isSerialized) {
      const serialized = this.serialization!.serialize(value)
      const compressed = this.serialization!.compress(serialized)

      // Set segmented entries
      let index = 0
      for (let i = 0; i < compressed.length; i += UINT8ARRAY_LENGTH_LIMIT) {
        const part = compressed.subarray(i, i + UINT8ARRAY_LENGTH_LIMIT)
        const key = extendKey(this._keys.segment, docId, index)
        keys.push(key)
        atomic.set(key, part, options)
        index++
      }

      // Set serialized document entry
      docValue = {
        ids: keys.map((key) => getDocumentId(key)!).filter((id) =>
          typeof id !== "undefined"
        ),
      } as SerializedEntry
    }

    // Set documetn entry
    atomic.set(idKey, docValue, options)

    // Set indices if is indexable
    if (this._isIndexable) {
      setIndices(
        docId,
        value as KvObject,
        docValue,
        atomic,
        this,
        options,
      )
    }

    // Commit atomic operation
    const cr = await atomic.commit()

    // Delete all entries if failed
    if (!cr.ok) {
      const deletes = new AtomicWrapper(this.kv)
      deletes.delete(idKey)

      keys.forEach((key) => deletes.delete(key))

      if (!this._isIndexable) {
        deleteIndices(
          docId,
          value as KvObject,
          deletes,
          this,
        )
      }

      await deletes.commit()

      // Return commit error
      return {
        ok: false,
      }
    }

    // Return commit result
    return {
      ...cr,
      id: docId,
    }
  }

  /**
   * Update a document entry with new data.
   *
   * @param doc
   * @param data
   * @param options
   * @returns
   */
  private async updateDocument(
    doc: Document<TOutput>,
    data: UpdateData<TOutput>,
    options: UpdateOptions | undefined,
  ): Promise<CommitResult<TOutput> | Deno.KvCommitError> {
    // Get document value, delete document entry
    const { value, id } = doc

    // If indexable, check for index collisions
    if (this._isIndexable) {
      const atomic = checkIndices(
        data as KvObject,
        new AtomicWrapper(this.kv, options?.atomicBatchSize),
        this,
      )

      const cr = await atomic.commit()

      // If check fails, return commit error
      if (!cr.ok) {
        return {
          ok: false,
        }
      }

      // Delete document entry
      await this.delete(id)
    }

    let updated = data as TOutput

    if (isKvObject(value)) {
      // Merge value and data according to given merge type
      const mergeType = options?.mergeType ?? DEFAULT_MERGE_TYPE

      updated = mergeType === "shallow"
        ? {
          ...value as KvObject,
          ...data as KvObject,
        } as TOutput
        : deepMerge(value, data) as TOutput
    }

    // Set new document value
    return await this.setDocument(
      id,
      updated as ParseInputType<TInput, TOutput>,
      options,
      true,
    )
  }

  /**
   * Construct a document from an entry.
   *
   * @param entry
   * @returns
   */
  private async constructDocument(
    { key, value, versionstamp }: Deno.KvEntryMaybe<any>,
  ) {
    if (!value || !versionstamp) {
      return null
    }

    const { __id__ } = value as IndexDataEntry<any>
    const docId = __id__ ?? getDocumentId(key)

    if (!docId) {
      return null
    }

    if (this._isSerialized) {
      // Get document parts
      const { ids } = value as SerializedEntry

      const keys = ids.map((segId) =>
        extendKey(this._keys.segment, docId, segId)
      )

      const docEntries = await kvGetMany<Uint8Array>(keys, this.kv)

      // Gather parts
      const data = Uint8Array.from(
        docEntries.map((doc) => Array.from(doc.value!)).flat(),
      )

      // Decompress and deserialize
      const serialized = this.serialization!.decompress(data)
      const deserialized = deserialize<TOutput>(serialized)

      // Return parsed document
      return new Document<TOutput>(this._model, {
        id: docId,
        value: deserialized,
        versionstamp,
      })
    }

    return new Document<TOutput>(this._model, {
      id: docId,
      value: value as TOutput,
      versionstamp,
    })
  }

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
    fn: (doc: Document<TOutput>) => T,
    options: ListOptions<TOutput> | undefined,
  ) {
    // Create list iterator with given options
    const selector = createListSelector(prefixKey, options)
    const iter = this.kv.list<KvValue>(selector, options)

    // Initiate lists
    const docs: Document<TOutput>[] = []
    const result: Awaited<T>[] = []
    const errors: unknown[] = []

    // Loop over each document entry
    for await (const entry of iter) {
      // Construct document from entry
      const doc = await this.constructDocument(entry)

      // Continue if document not constructed
      if (!doc) {
        continue
      }

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
}
