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
  HistoryEntry,
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
  SerializedEntry,
  Serializer,
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
  deleteIndices,
  denoCoreDeserialize,
  denoCoreSerialize,
  extendKey,
  generateId,
  getDocumentId,
  isDeployRuntime,
  isKvObject,
  jsonDeserialize,
  jsonSerialize,
  kvGetMany,
  prepareEnqueue,
  selectsAll,
  setIndices,
} from "./utils.ts"
import {
  DEFAULT_MERGE_TYPE,
  HISTORY_KEY_PREFIX,
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
import { concat, deepMerge, ulid } from "./deps.ts"

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

  readonly _model: Model<TInput, TOutput>
  readonly _primaryIndexList: string[]
  readonly _secondaryIndexList: string[]
  readonly _keys: CollectionKeys
  readonly _idGenerator: IdGenerator<TOutput>
  readonly _serializer: Serializer
  readonly _isIndexable: boolean
  readonly _isSerialized: boolean
  readonly _keepsHistory: boolean

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
      history: extendKey(
        [KVDEX_KEY_PREFIX],
        HISTORY_KEY_PREFIX,
        ...key,
      ),
      historySegment: extendKey(
        [KVDEX_KEY_PREFIX],
        HISTORY_KEY_PREFIX,
        SEGMENT_KEY_PREFIX,
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
    this._isSerialized = !!opts?.serialize

    const isDeploy = isDeployRuntime()
    const defaultSerialize = isDeploy ? jsonSerialize : denoCoreSerialize
    const defaultDeserialize = isDeploy ? jsonDeserialize : denoCoreDeserialize

    if (opts?.serialize === "auto") {
      this._serializer = {
        serialize: defaultSerialize,
        deserialize: defaultDeserialize,
        compress,
        decompress,
      }
    } else if (opts?.serialize === "core") {
      this._serializer = {
        serialize: denoCoreSerialize,
        deserialize: denoCoreDeserialize,
        compress,
        decompress,
      }
    } else if (opts?.serialize == "json") {
      this._serializer = {
        serialize: jsonSerialize,
        deserialize: jsonDeserialize,
        compress,
        decompress,
      }
    } else {
      this._serializer = {
        serialize: defaultSerialize,
        deserialize: defaultDeserialize,
        compress,
        decompress,
        ...opts?.serialize,
      }
    }

    // Set isIndexable flag
    this._isIndexable = this._primaryIndexList.length > 0 ||
      this._secondaryIndexList.length > 0

    // Set keepsHistory flag
    this._keepsHistory = options?.history ?? false
  }

  /**********************/
  /*                    */
  /*   PUBLIC METHODS   */
  /*                    */
  /**********************/

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
    const serialized = this._serializer.serialize(value)
    const compressed = this._serializer.compress(serialized)

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
    const serialized = this._serializer.serialize(value)
    const compressed = this._serializer.compress(serialized)

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
   * Retrieve the version history of a document by id.
   *
   * A history entry contains a timestamp, type of either "write" or "delete",
   * and a copy of the document value if the type is "write".
   *
   * @example
   * ```ts
   * const history = await db.users.findHistory("user_id")
   * ```
   *
   * @param id - Document id.
   * @returns A promise resolving to a list of history entries.
   */
  async findHistory(id: KvId) {
    // Initialize result list and create history key prefix
    const result: HistoryEntry<TOutput>[] = []
    const historyKeyPrefix = extendKey(this._keys.history, id)

    // Create hsitory entries iterator
    const iter = this.kv.list<HistoryEntry<TOutput>>({
      prefix: historyKeyPrefix,
    })

    // Collect history entries
    for await (const { value, key } of iter) {
      // Handle serialized entries
      if (value.type === "write" && this._isSerialized) {
        const { ids } = value.value as SerializedEntry
        const timeId = getDocumentId(key)!

        const keys = ids.map((segmentId) =>
          extendKey(this._keys.historySegment, id, timeId, segmentId)
        )

        const entries = await kvGetMany<Uint8Array>(keys, this.kv)

        // Concatenate chunks
        const data = concat(entries.map((entry) => entry.value!))

        // Decompress and deserialize
        const serialized = this._serializer.decompress(data)
        const deserialized = this._serializer.deserialize<TOutput>(serialized)

        // Add history entry
        result.push({
          type: value.type,
          timestamp: value.timestamp,
          value: this._model.__validate?.(deserialized) ??
            this._model.parse(deserialized as any),
        })
      } else if (value.type === "write") {
        // Add history entry with parsed value
        result.push({
          type: value.type,
          timestamp: value.timestamp,
          value: this._model.__validate?.(value.value) ??
            this._model.parse(value.value as any),
        })
      } else {
        // Add "delete" history entry
        result.push(value)
      }
    }

    // Return result list
    return result
  }

  /**
   * Adds a new document to the KV store with a generated id.
   *
   * Does not overwrite existing documents with coliiding id.
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
   * @returns Promise resolving to a CommitResult or CommitError.
   */
  async add(value: ParseInputType<TInput, TOutput>, options?: SetOptions) {
    // Set document value with generated id
    return await this.setDocument(null, value, options, false)
  }

  /**
   * Adds a new document with the given id to the KV store.
   *
   * Does not overwrite existing documents with coliiding id.
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
   * @returns Promise resolving to a CommitResult or CommitError.
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
   * @returns Promise resolving to a CommitResult or CommitError.
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
    await this.deleteDocuments(ids, this._keepsHistory)
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
    const serialized = this._serializer.serialize(value)
    const compressed = this._serializer.compress(serialized)

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
    await this.deleteDocuments([__id__], this._keepsHistory)
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
    const serialized = this._serializer.serialize(value)
    const compressed = this._serializer.compress(serialized)

    // Create prefix key
    const prefixKey = extendKey(
      this._keys.secondaryIndex,
      index as KvId,
      compressed,
    )

    // Delete documents by secondary index, return iterator cursor
    const { cursor } = await this.handleMany(
      prefixKey,
      (doc) => this.deleteDocuments([doc.id], this._keepsHistory),
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
   * new data with the exisiting data using deep merge
   * by default, or optionally using shallow merge.
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
    const serialized = this._serializer.serialize(value)
    const compressed = this._serializer.compress(serialized)

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
   * Adds multiple documents to the KV store with generated ids.
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
   * @returns A promise that resolves to a list of CommitResults or CommitErrors.
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
      // Create list iterator and empty keys list, init atomic operation
      const iter = this.kv.list({ prefix: this._keys.base }, options)
      const keys: Deno.KvKey[] = []
      const atomic = new AtomicWrapper(this.kv, options?.atomicBatchSize)

      // Collect all collection entry keys
      for await (const { key } of iter) {
        keys.push(key)
      }

      // Set history entries if keeps history
      if (this._keepsHistory) {
        for await (const { key } of this.kv.list({ prefix: this._keys.id })) {
          const id = getDocumentId(key)

          if (!id) {
            continue
          }

          const historyKey = extendKey(this._keys.history, id, ulid())

          const historyEntry: HistoryEntry<TOutput> = {
            type: "delete",
            timestamp: new Date(),
          }

          atomic.set(historyKey, historyEntry)
        }
      }

      // Delete all keys and return
      keys.forEach((key) => atomic.delete(key))
      await atomic.commit()
    }

    // Execute delete operation for each document entry
    const { cursor } = await this.handleMany(
      this._keys.id,
      (doc) => this.deleteDocuments([doc.id], this._keepsHistory),
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
    const serialized = this._serializer.serialize(value)
    const compressed = this._serializer.compress(serialized)

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
    const serialized = this._serializer.serialize(value)
    const compressed = this._serializer.compress(serialized)

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
    const serialized = this._serializer.serialize(value)
    const compressed = this._serializer.compress(serialized)

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

  /***********************/
  /*                     */
  /*   PRIVATE METHODS   */
  /*                     */
  /***********************/

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

  /**
   * Inner set document.
   *
   * @param docId
   * @param idKey
   * @param value
   * @param options
   * @param overwrite
   * @returns
   */
  async setDoc(
    docId: KvId,
    idKey: KvKey,
    value: TOutput,
    options: SetOptions | undefined,
    overwrite = false,
  ): Promise<CommitResult<TOutput> | Deno.KvCommitError> {
    // Initialize atomic operation and keys list
    const atomic = this.kv.atomic()
    const ids: KvId[] = []
    let docValue: any = value
    const timeId = ulid()

    // Check for id collision
    atomic.check({
      key: idKey,
      versionstamp: null,
    })

    // Serialize if enabled
    if (this._isSerialized) {
      const serialized = this._serializer.serialize(value)
      const compressed = this._serializer.compress(serialized)

      // Set segmented entries
      let index = 0
      for (let i = 0; i < compressed.length; i += UINT8ARRAY_LENGTH_LIMIT) {
        const part = compressed.subarray(i, i + UINT8ARRAY_LENGTH_LIMIT)
        const key = extendKey(this._keys.segment, docId, index)
        ids.push(index)
        atomic.set(key, part, options)

        // Set history segments if keeps history
        if (this._keepsHistory) {
          const historySegmentKey = extendKey(
            this._keys.historySegment,
            docId,
            timeId,
            index,
          )

          atomic.set(historySegmentKey, part)
        }

        index++
      }

      // Set serialized document entry
      docValue = {
        ids,
      }
    }

    // Set document entry
    atomic.set(idKey, docValue, options)

    // Set history entry if keeps history
    if (this._keepsHistory) {
      const historyKey = extendKey(this._keys.history, docId, timeId)

      const historyEntry: HistoryEntry<any> = {
        type: "write",
        timestamp: new Date(),
        value: docValue,
      }

      atomic.set(historyKey, historyEntry)
    }

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

    // Handle failed operation
    if (!cr.ok) {
      // If overwrite is true, check for id and indices collision
      if (overwrite) {
        const [
          idCheck,
          indicesCheck,
        ] = await Promise.all([
          this.kv
            .atomic()
            .check({
              key: idKey,
              versionstamp: null,
            })
            .commit(),

          checkIndices(
            value as KvObject,
            this.kv.atomic(),
            this,
          ).commit(),
        ])

        // If only id collision, delete exisitng document and try again
        if (!idCheck.ok && indicesCheck.ok) {
          await this.deleteDocuments([docId], false)
          return await this.setDoc(docId, idKey, value, options, overwrite)
        }

        // Operation is not retryable if indices collision is detected
        return {
          ok: false,
        }
      }

      // Check for remaining retry attempts
      const retry = options?.retry ?? 0
      if (retry > 0) {
        return await this.setDoc(docId, idKey, value, options, overwrite)
      }

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
        this.kv.atomic(),
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
      await this.deleteDocuments([id], false)
    }

    let updated = data as TOutput

    // Perform merge if value is kv object
    if (isKvObject(value)) {
      const mergeType = options?.mergeType ?? DEFAULT_MERGE_TYPE

      updated = mergeType === "shallow"
        ? {
          ...value as KvObject,
          ...data as KvObject,
        } as TOutput
        : deepMerge(value as KvObject, data as KvObject, {
          arrays: "merge",
          maps: "merge",
          sets: "merge",
        }) as TOutput
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

      // Concatenate chunks
      const data = concat(docEntries.map((entry) => entry.value!))

      // Decompress and deserialize
      const serialized = this._serializer.decompress(data)
      const deserialized = this._serializer.deserialize<TOutput>(serialized)

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

  private async deleteDocuments(ids: KvId[], recordHistory: boolean) {
    // Initialize atomic operation
    const atomic = new AtomicWrapper(this.kv)

    // Set delete history entry if recordHistory is true
    if (recordHistory) {
      ids.forEach((id) => {
        const historyKey = extendKey(this._keys.history, id, ulid())

        const historyEntry: HistoryEntry<TOutput> = {
          type: "delete",
          timestamp: new Date(),
        }

        atomic.set(historyKey, historyEntry)
      })
    }

    if (this._isIndexable && this._isSerialized) {
      // Run delete operations for each id
      await allFulfilled(ids.map(async (id) => {
        // Create document id key, get entry and construct document
        const idKey = extendKey(this._keys.id, id)
        const entry = await this.kv.get<SerializedEntry>(idKey)
        const doc = await this.constructDocument(entry)

        // Delete document entries
        atomic.delete(idKey)

        if (entry.value) {
          const keys = entry.value.ids.map((segId) =>
            extendKey(this._keys.segment, id, segId)
          )

          keys.forEach((key) => atomic.delete(key))
        }

        if (doc) {
          deleteIndices(id, doc.value as KvObject, atomic, this)
        }
      }))

      // Commit the operation
      await atomic.commit()
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

        // Delete document entries
        atomic.delete(idKey)
        deleteIndices(id, value, atomic, this)
      }))

      // Commit the operation
      await atomic.commit()
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

        // Delete document entries
        atomic.delete(idKey)

        const keys = value.ids.map((segId) =>
          extendKey(this._keys.segment, id, segId)
        )

        keys.forEach((key) => atomic.delete(key))
      }))

      // Commit the operation
      await atomic.commit()
      return
    }

    // Perform delete for each id and commit the operation
    ids.forEach((id) => atomic.delete(extendKey(this._keys.id, id)))
    await atomic.commit()
  }
}
