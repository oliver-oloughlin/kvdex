import type {
  BuilderFn,
  CheckKeyOf,
  CollectionKeys,
  CollectionOptions,
  CommitResult,
  DenoKv,
  DenoKvCommitError,
  DenoKvCommitResult,
  DenoKvEntryMaybe,
  DenoKvStrictKey,
  EnqueueOptions,
  FindManyOptions,
  FindOptions,
  HandleOneOptions,
  HistoryEntry,
  IdempotentListener,
  IdGenerator,
  IdUpsert,
  IndexDataEntry,
  KvId,
  KvKey,
  KvObject,
  KvValue,
  ListOptions,
  ManyCommitResult,
  Model,
  Pagination,
  PaginationResult,
  PossibleCollectionOptions,
  PrimaryIndexKeys,
  PrimaryIndexUpsert,
  QueueHandlers,
  QueueListenerOptions,
  QueueMessageHandler,
  SecondaryIndexKeys,
  SerializedEntry,
  Serializer,
  SetOptions,
  UpdateData,
  UpdateManyOptions,
  UpdateOneOptions,
  UpdateOptions,
  UpdateStrategy,
  WatchOptions,
} from "./types.ts"
import {
  allFulfilled,
  checkIndices,
  compress,
  createHandlerId,
  createListOptions,
  createListSelector,
  createSecondaryIndexKeyPrefix,
  decompress,
  deleteIndices,
  extendKey,
  generateId,
  getDocumentId,
  isKvObject,
  jsonDeserialize,
  jsonSerialize,
  kvGetMany,
  prepareEnqueue,
  selectsAll,
  setIndices,
} from "./utils.ts"
import {
  DEFAULT_UPDATE_STRATEGY,
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
import { AtomicPool } from "./atomic_pool.ts"
import { Document } from "./document.ts"
import { model } from "./model.ts"
import { concat, deepMerge, ulid } from "./deps.ts"
import { v8Serialize } from "./utils.ts"
import { v8Deserialize } from "./utils.ts"

/**
 * Create a new collection within a database context.
 *
 * @example
 * ```ts
 * import { model, collection, kvdex } from "jsr:@olli/kvdex"
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
 *     serialize: "json",
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
): BuilderFn<TInput, TOutput, TOptions> {
  return (
    kv: DenoKv,
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

/** Represents a collection of documents and provides methods for handling them, alongside queues. */
export class Collection<
  const TInput,
  const TOutput extends KvValue,
  const TOptions extends CollectionOptions<TOutput>,
> {
  private kv: DenoKv
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
    kv: DenoKv,
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

    if (opts?.serialize === "v8") {
      this._serializer = {
        serialize: v8Serialize,
        deserialize: v8Deserialize,
        compress,
        decompress,
      }
    } else if (opts?.serialize === "v8-uncompressed") {
      this._serializer = {
        serialize: v8Serialize,
        deserialize: v8Deserialize,
        compress: (v) => v,
        decompress: (v) => v,
      }
    } else if (opts?.serialize === "json") {
      this._serializer = {
        serialize: jsonSerialize,
        deserialize: jsonDeserialize,
        compress,
        decompress,
      }
    } else if (opts?.serialize === "json-uncompressed") {
      this._serializer = {
        serialize: jsonSerialize,
        deserialize: jsonDeserialize,
        compress: (v) => v,
        decompress: (v) => v,
      }
    } else {
      this._serializer = {
        serialize: jsonSerialize,
        deserialize: jsonDeserialize,
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
  async find(
    id: KvId,
    options?: FindOptions,
  ): Promise<Document<TOutput> | null> {
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
  ): Promise<Document<TOutput> | null> {
    // Serialize and compress index value
    const serialized = await this._serializer.serialize(value)
    const compressed = await this._serializer.compress(serialized)

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
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    options?: ListOptions<Document<TOutput>>,
  ): Promise<PaginationResult<Document<TOutput>>> {
    // Serialize and compress index value
    const serialized = await this._serializer.serialize(value)
    const compressed = await this._serializer.compress(serialized)

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
   * const users = await db.users.findMany(["user1", "user2", "user3"])
   * ```
   *
   * @example
   * ```ts
   * const users = await db.users.findMany(["user1", "user2", "user3"], {
   *   consistency: "eventual" // "strong" by default
   * })
   * ```
   *
   * @param ids - Array of ids of the documents to be found.
   * @param options - Find many options, optional.
   * @returns A promise that resolves to an array of documents.
   */
  async findMany(
    ids: KvId[],
    options?: FindManyOptions,
  ): Promise<Document<TOutput>[]> {
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
   * const { result } = await db.users.findHistory("user_id")
   * ```
   *
   * @example
   * ```ts
   * const { result } = await db.users.findHistory("user_id", {
   *   filter: (entry) => entry.type === "write",
   * })
   * ```
   *
   * @param id - Document id.
   * @returns A promise resolving to a list of history entries.
   */
  async findHistory(
    id: KvId,
    options?: ListOptions<HistoryEntry<TOutput>>,
  ): Promise<PaginationResult<HistoryEntry<TOutput>>> {
    // Initialize result list and create history key prefix
    const result: HistoryEntry<TOutput>[] = []
    const keyPrefix = extendKey(this._keys.history, id)
    const selector = createListSelector(keyPrefix, options)

    // Create hsitory entries iterator
    const listOptions = createListOptions(options)
    const iter = this.kv.list(selector, listOptions)

    // Collect history entries
    let count = 0
    const offset = options?.offset ?? 0
    for await (const { value, key } of iter) {
      // Skip by offset
      count++

      if (count <= offset) {
        continue
      }

      // Cast history entry
      let historyEntry = value as HistoryEntry<TOutput>

      // Handle serialized entries
      if (historyEntry.type === "write" && this._isSerialized) {
        const { ids } = historyEntry.value as SerializedEntry
        const timeId = getDocumentId(key as DenoKvStrictKey)!

        const keys = ids.map((segmentId) =>
          extendKey(this._keys.historySegment, id, timeId, segmentId)
        )

        const entries = await kvGetMany(keys, this.kv)

        // Concatenate chunks
        const data = concat(entries.map((entry) => entry.value as Uint8Array))

        // Decompress and deserialize
        const serialized = await this._serializer.decompress(data)
        const deserialized = await this._serializer.deserialize<TOutput>(
          serialized,
        )

        // Set history entry
        historyEntry = {
          ...historyEntry,
          value: this._model.parse?.(deserialized),
        }
      } else if (historyEntry.type === "write") {
        // Set history entry
        historyEntry = {
          ...historyEntry,
          value: this._model.parse?.(historyEntry.value),
        }
      }

      // Filter and add history entry to result list
      const filter = options?.filter
      if (!filter || filter(historyEntry)) {
        result.push(historyEntry)
      }
    }

    // Return result list and iterator cursor
    return {
      result,
      cursor: iter.cursor || undefined,
    }
  }

  /**
   * Adds a new document to the KV store with a generated id.
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
  async add(
    value: TInput,
    options?: SetOptions,
  ): Promise<CommitResult<TOutput> | DenoKvCommitError> {
    // Set document value with generated id
    return await this.setDocument(null, value, options)
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
    data: TInput,
    options?: SetOptions,
  ): Promise<CommitResult<TOutput> | DenoKvCommitError> {
    return await this.setDocument(id, data, options)
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
  async delete(...ids: KvId[]): Promise<void> {
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
  ): Promise<void> {
    // Serialize and compress index value
    const serialized = await this._serializer.serialize(value)
    const compressed = await this._serializer.compress(serialized)

    // Create index key
    const key = extendKey(
      this._keys.primaryIndex,
      index as KvId,
      compressed,
    )

    // Get index entry
    const result = await this.kv.get(key, options)

    // If no value, abort delete
    if (result.value === null || result.versionstamp === null) {
      return
    }

    // Extract document id from index entry
    const { __id__ } = result.value as
      & unknown
      & Pick<IndexDataEntry<KvObject>, "__id__">

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
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    options?: ListOptions<Document<TOutput>>,
  ): Promise<Pagination> {
    // Serialize and compress index value
    const serialized = await this._serializer.serialize(value)
    const compressed = await this._serializer.compress(serialized)

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
   * By default, the `merge` strategy is used when available, falling back to
   * `replace` for primitive types and built-in objects (Date, RegExp, etc.).
   * For plain objects, the `merge-shallow` strategy is also supported.
   *
   * @example
   * ```ts
   * // Updates by replacing the existing value
   * const result = await db.numbers.update("num1", 10)
   * ```
   *
   * @example
   * ```ts
   * // Partial update using merge, only updates the age field
   * const result = await db.users.update(
   *   "oliver",
   *   { age: 30 },
   *   { strategy: "merge" }
   * )
   * ```
   *
   * @param id - Id of document to be updated
   * @param data - Updated data to be inserted into document
   * @param options - Set options, optional.
   * @returns
   */
  async update<const T extends UpdateOptions>(
    id: KvId,
    data: UpdateData<TOutput, T["strategy"]>,
    options?: T,
  ): Promise<CommitResult<TOutput> | DenoKvCommitError> {
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
   * ```
   *
   * @example
   * ```ts
   * // Updates a user document using shallow merge
   * const result = await db.users.updateByPrimaryIndex(
   *   "username",
   *   "anders",
   *   { age: 89 },
   *   { strategy: "merge-shallow" }
   * )
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
    const T extends UpdateOptions,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    data: UpdateData<TOutput, T["strategy"]>,
    options?: T,
  ): Promise<CommitResult<TOutput> | DenoKvCommitError> {
    // Find document by primary index
    const doc = await this.findByPrimaryIndex(index, value)

    // If no document, return commit error
    if (!doc) {
      return {
        ok: false,
      }
    }

    // Update document, return result
    return await this.updateDocument(doc, data, options)
  }

  /**
   * Update documents in the collection by a secondary index.
   *
   * @example
   * ```ts
   * // Updates all user documents with age = 24 and sets age = 67
   * const { result } = await db.users.updateBySecondaryIndex("age", 24, { age: 67 })
   * ```
   *
   * @example
   * ```ts
   * // Updates all users where age = 24 and username starts with "o", using shallow merge
   * const { result } = await db.users.updateBySecondaryIndex(
   *   "age",
   *   24,
   *   { age: 67 },
   *   {
   *     filter: (doc) => doc.value.username.startsWith("o"),
   *     strategy: "merge-shallow",
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
    const T extends UpdateManyOptions<Document<TOutput>>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    data: UpdateData<TOutput, T["strategy"]>,
    options?: T,
  ): Promise<PaginationResult<CommitResult<TOutput> | DenoKvCommitError>> {
    // Serialize and compress index value
    const serialized = await this._serializer.serialize(value)
    const compressed = await this._serializer.compress(serialized)

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
   * Update an existing document by id, or set a new document entry if no matching document exists.
   *
   * @example
   * ```ts
   * const result = await db.users.upsert({
   *   id: "user_id",
   *   update: { username: "Chris" },
   *   set: {
   *     username: "Chris",
   *     age: 54,
   *     activities: ["bowling"],
   *     address: {
   *       country: "USA",
   *       city: "Las Vegas"
   *       street: "St. Boulevard"
   *       houseNumber: 23
   *     }
   *   }
   * })
   * ```
   *
   * @param input - Upsert by id input.
   * @param options - Upsert options.
   * @returns A promise resolving to either CommitResult or CommitError.
   */
  async upsert<
    const TUpsertOptions extends UpdateOptions,
  >(
    input: IdUpsert<TInput, TOutput, TUpsertOptions["strategy"]>,
    options?: TUpsertOptions,
  ): Promise<CommitResult<TOutput> | DenoKvCommitError> {
    const updateCr = await this.update(input.id, input.update, options)

    if (updateCr.ok) {
      return updateCr
    }

    // Set new entry with given id
    return await this.set(input.id, input.set, {
      ...options,
      overwrite: false,
    })
  }

  /**
   * Update an existing document by a primary index, or set a new entry if no matching document exists.
   *
   * An id can be optionally specified which will be used when creating a new document entry.
   *
   * @example
   * ```ts
   * const result = await db.users.upsertByPrimaryIndex({
   *   index: ["username", "Jack"],
   *   update: { username: "Chris" },
   *   set: {
   *     username: "Chris",
   *     age: 54,
   *     activities: ["bowling"],
   *     address: {
   *       country: "USA",
   *       city: "Las Vegas"
   *       street: "St. Boulevard"
   *       houseNumber: 23
   *     }
   *   }
   * })
   * ```
   *
   * @param input - Upsert by primary index input.
   * @param options - Upsert options.
   * @returns A promise resolving to either CommitResult or CommitError.
   */
  async upsertByPrimaryIndex<
    const TIndex extends PrimaryIndexKeys<TOutput, TOptions>,
    const TUpsertOptions extends UpdateOptions,
  >(
    input: PrimaryIndexUpsert<
      TInput,
      TOutput,
      TIndex,
      TUpsertOptions["strategy"]
    >,
    options?: TUpsertOptions,
  ): Promise<CommitResult<TOutput> | DenoKvCommitError> {
    // First attempt update
    const updateCr = await this.updateByPrimaryIndex(
      ...input.index,
      input.update,
      options,
    )

    if (updateCr.ok) {
      return updateCr
    }

    // If id is present, set new entry with given id
    if (input.id) {
      return await this.set(input.id, input.set, {
        ...options,
        overwrite: false,
      })
    }

    // If no id, add new entry with generated id
    return await this.add(input.set, {
      ...options,
      overwrite: false,
    })
  }

  /**
   * Update the value of multiple existing documents in the collection.
   *
   * @example
   * ```ts
   * // Updates all user documents and sets name = 67
   * await db.users.updateMany({ age: 67 })
   * ```
   *
   * @example
   * ```ts
   * // Updates all users where age > 20, using shallow merge
   * await db.users.updateMany({ age: 67 }, {
   *   filter: (doc) => doc.value.age > 20,
   *   strategy: "merge-shallow"
   * })
   * ```
   *
   * @example
   * ```ts
   * // Only updates first user document and fails the rest when username is a primary index
   * const { result } = await db.users.updateMany({ username: "oliver" })
   * ```
   *
   * @param value - Updated value to be inserted into documents.
   * @param options - Update many options, optional.
   * @returns Promise resolving to an object containing iterator cursor and result list.
   */
  async updateMany<const T extends UpdateManyOptions<Document<TOutput>>>(
    value: UpdateData<TOutput, T["strategy"]>,
    options?: T,
  ): Promise<PaginationResult<CommitResult<TOutput> | DenoKvCommitError>> {
    // Update each document, add commit result to result list
    return await this.handleMany(
      this._keys.id,
      (doc) => this.updateDocument(doc, value, options),
      options,
    )
  }

  /**
   * Update the value of one existing document in the collection.
   *
   * @example
   * ```ts
   * // Updates the first user document and sets name = 67
   * const result = await db.users.updateOne({ age: 67 })
   * ```
   *
   * @example
   * ```ts
   * // Updates the first user where age > 20, using shallow merge
   * const result = await db.users.updateOne({ age: 67 }, {
   *   filter: (doc) => doc.value.age > 20,
   *   strategy: "merge-shallow"
   * })
   * ```
   *
   * @param data - Updated data to be inserted into documents.
   * @param options - Update many options, optional.
   * @returns Promise resolving to either a commit result or commit error object.
   */
  async updateOne<
    const T extends UpdateOneOptions<Document<TOutput>>,
  >(
    data: UpdateData<TOutput, T["strategy"]>,
    options?: T,
  ): Promise<CommitResult<TOutput> | DenoKvCommitError> {
    // Update a single document
    const { result } = await this.handleMany(
      this._keys.id,
      (doc) => this.updateDocument(doc, data, options),
      { ...options, take: 1 },
    )

    // Return first result, or commit error object if not present
    return result.at(0) ?? {
      ok: false,
    }
  }

  /**
   * Update the value of one existing document in the collection by a secondary index.
   *
   * @example
   * ```ts
   * // Updates the first user with age = 20 and sets age = 67
   * const result = await db.users.updateOneBySecondaryIndex("age", 20, { age: 67 })
   * ```
   *
   * @example
   * ```ts
   * // Updates the first user where age = 20 and username starts with "a", using shallow merge
   * const result = await db.users.updateOne("age", 20, { age: 67 }, {
   *   filter: (doc) => doc.value.username.startsWith("a"),
   *   strategy: "merge-shallow"
   * })
   * ```
   *
   * @param index - Index.
   * @param value - Index value.
   * @param data - Updated data to be inserted into documents.
   * @param options - Update many options, optional.
   * @returns Promise resolving to either a commit result or commit error object.
   */
  async updateOneBySecondaryIndex<
    const T extends UpdateOneOptions<Document<TOutput>>,
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    data: UpdateData<TOutput, T["strategy"]>,
    options?: T,
  ): Promise<CommitResult<TOutput> | DenoKvCommitError> {
    // Create prefix key
    const prefixKey = await createSecondaryIndexKeyPrefix(
      index,
      value as KvValue,
      this,
    )

    // Update a single document
    const { result } = await this.handleMany(
      prefixKey,
      (doc) => this.updateDocument(doc, data, options),
      { ...options, take: 1 },
    )

    // Return first result, or commit error object if not present
    return result.at(0) ?? {
      ok: false,
    }
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
    values: TInput[],
    options?: SetOptions,
  ): Promise<ManyCommitResult | DenoKvCommitError> {
    // Initiate result and error lists
    const results: (CommitResult<TOutput> | DenoKvCommitError)[] = []
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
  async deleteMany(
    options?: ListOptions<Document<TOutput>>,
  ): Promise<Pagination> {
    // Perform quick delete if all documents are to be deleted
    if (selectsAll(options)) {
      // Create list iterator and empty keys list, init atomic operation
      const iter = this.kv.list({ prefix: this._keys.base }, options)

      const keys: DenoKvStrictKey[] = []
      const atomic = new AtomicWrapper(this.kv)

      // Collect all collection entry keys
      for await (const { key } of iter) {
        keys.push(key as DenoKvStrictKey)
      }

      // Set history entries if keeps history
      if (this._keepsHistory) {
        for await (const { key } of this.kv.list({ prefix: this._keys.id })) {
          const id = getDocumentId(key as DenoKvStrictKey)

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
  async getMany(
    options?: ListOptions<Document<TOutput>>,
  ): Promise<PaginationResult<Document<TOutput>>> {
    // Get each document, return result list and current iterator cursor
    return await this.handleMany(
      this._keys.id,
      (doc) => doc,
      options,
    )
  }

  /**
   * Retrieves one document from the KV store according to the given options.
   *
   * If no options are given, the first document in the collection is retreived.
   *
   * @example
   * ```ts
   * // Get the first user
   * const user = await db.users.getOne()
   * ```
   *
   * @example
   * ```ts
   * // Get the first user with username that starts with "a"
   * const user = await db.users.getOne({
   *   filter: doc => doc.value.username.startsWith("a")
   * })
   * ```
   *
   * @param options - List options, optional.
   * @returns A promise that resovles to the retreived document
   */
  async getOne(
    options?: HandleOneOptions<Document<TOutput>>,
  ): Promise<Document<TOutput> | null> {
    // Get result list with limit of one item
    const { result } = await this.handleMany(
      this._keys.id,
      (doc) => doc,
      { ...options, take: 1 },
    )

    // Return first result item, or null if not present
    return result.at(0) ?? null
  }

  /**
   * Retrieves one document from the KV store by a secondary index and according to the given options.
   *
   * If no options are given, the first document in the collection by the given index is retreived.
   *
   * @example
   * ```ts
   * // Get the first user with age = 69
   * const user = await db.users.getOneBySecondaryIndex("age", 69)
   * ```
   *
   * @example
   * ```ts
   * // Get the first user with age = 40 and username that starts with "a"
   * const user = await db.users.getOneBySecondaryIndex("age", 40, {
   *   filter: doc => doc.value.username.startsWith("a")
   * })
   * ```
   *
   * @param index - Index.
   * @param value - Index value.
   * @param options - List options, optional.
   * @returns A promise resolving to either a document or null.
   */
  async getOneBySecondaryIndex<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    options?: HandleOneOptions<Document<TOutput>>,
  ): Promise<Document<TOutput> | null> {
    // Create prefix key
    const prefixKey = await createSecondaryIndexKeyPrefix(
      index,
      value as KvValue,
      this,
    )

    // Get result list with limit of one item
    const { result } = await this.handleMany(
      prefixKey,
      (doc) => doc,
      { ...options, take: 1 },
    )

    // Return first result item, or null if not present
    return result.at(0) ?? null
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
    options?: ListOptions<Document<TOutput>>,
  ): Promise<Pagination> {
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
    options?: UpdateManyOptions<Document<TOutput>>,
  ): Promise<Pagination> {
    // Create prefix key
    const prefixKey = await createSecondaryIndexKeyPrefix(
      index,
      value as KvValue,
      this,
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
    options?: ListOptions<Document<TOutput>>,
  ): Promise<PaginationResult<Awaited<T>>> {
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
    options?: UpdateManyOptions<Document<TOutput>>,
  ): Promise<PaginationResult<Awaited<T>>> {
    // Serialize and compress index value
    const serialized = await this._serializer.serialize(value)
    const compressed = await this._serializer.compress(serialized)

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
  async count(options?: ListOptions<Document<TOutput>>): Promise<number> {
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
    options?: ListOptions<Document<TOutput>>,
  ): Promise<number> {
    // Serialize and compress index value
    const serialized = await this._serializer.serialize(value)
    const compressed = await this._serializer.compress(serialized)

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
   * @returns A promise resolving to DenoKvCommitResult.
   */
  async enqueue<T extends KvValue>(
    data: T,
    options?: EnqueueOptions,
  ): Promise<DenoKvCommitResult> {
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
  async listenQueue<T extends KvValue = KvValue>(
    handler: QueueMessageHandler<T>,
    options?: QueueListenerOptions,
  ): Promise<void> {
    // Create handler id
    const handlerId = createHandlerId(this._keys.base, options?.topic)

    // Add new handler to specified handlers
    const handlers = this.queueHandlers.get(handlerId) ?? []
    handlers.push(handler as QueueMessageHandler<KvValue>)
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
  ): Promise<Document<T> | null> {
    // Create document key, get document entry
    const key = extendKey(this._keys.undelivered, id)
    const result = await this.kv.get(key, options)

    // If no entry exists, return null
    if (result.value === null || result.versionstamp === null) {
      return null
    }

    // Return document
    return new Document(model<T, T>(), {
      id,
      versionstamp: result.versionstamp,
      value: result.value as T,
    })
  }

  /**
   * Delete the version history of a document by id.
   *
   * @example
   * ```ts
   * await db.users.deleteHistory("user_id")
   * ```
   *
   * @param id - Document id.
   */
  async deleteHistory(id: KvId): Promise<void> {
    // Initialize atomic operation and create iterators
    const atomic = new AtomicWrapper(this.kv)
    const historyKeyPrefix = extendKey(this._keys.history, id)
    const historySegmentKeyPrefix = extendKey(this._keys.historySegment, id)
    const historyIter = this.kv.list({ prefix: historyKeyPrefix })
    const historySegmentIter = this.kv.list({ prefix: historySegmentKeyPrefix })

    // Delete history entries
    for await (const { key } of historyIter) {
      atomic.delete(key as DenoKvStrictKey)
    }

    // Delete any history segment entries
    for await (const { key } of historySegmentIter) {
      atomic.delete(key as DenoKvStrictKey)
    }

    // Commit atomic operation
    await atomic.commit()
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
  async deleteUndelivered(id: KvId): Promise<void> {
    const key = extendKey(this._keys.undelivered, id)
    await this.kv.delete(key)
  }

  /**
   * Listen for live changes to a single document by id.
   *
   * @example
   * ```ts
   * // Updates the document value every second
   * setInterval(() => db.numbers.set("id", Math.random()), 1_000)
   *
   * // Listen for any updates to the document value
   * db.numbers.watch("id", (doc) => {
   *   // Document will be null if the latest update was a delete operation
   *   console.log(doc?.value)
   * })
   * ```
   *
   * @param id - Id of document to watch for.
   * @param fn - Callback function to be invoked on each update.
   * @param options - Watch options.
   */
  async watch(
    id: KvId,
    fn: (doc: Document<TOutput> | null) => unknown,
    options?: WatchOptions,
  ): Promise<void> {
    // Create watch stream
    const key = extendKey(this._keys.id, id)
    const stream = this.kv.watch([key], options)

    // Catch incoming updates
    for await (const entries of stream) {
      // Get first entry
      const entry = entries.at(0)

      // If no entry is found, invoke callback function with null
      if (!entry) {
        await fn(null)
        continue
      }

      // Construct document and invoke callback function
      const doc = await this.constructDocument(entry)
      await fn(doc)
    }
  }

  /**
   * Listen for live changes to an array of specified documents by id.
   *
   * @example
   * ```ts
   * // Delayed setting of document values
   * setTimeout(() => db.numbers.set("id1", 10), 1_000)
   * setTimeout(() => db.numbers.set("id2", 20), 2_000)
   * setTimeout(() => db.numbers.set("id3", 30), 3_000)
   *
   * // Listen for any updates to the document values
   * db.numbers.watchMany(["id1", "id2", "id3"], (docs) => {
   *   // Prints for each update to any of the documents
   *   console.log(docs[0]?.value) // 10, 10, 10
   *   console.log(docs[1]?.value) // null, 20, 20
   *   console.log(docs[2]?.value) // null, null, 30
   * })
   * ```
   *
   * @param ids - List of ids of documents to watch.
   * @param fn - Callback function to be invoked on each update.
   * @param options - Watch options.
   */
  async watchMany(
    ids: KvId[],
    fn: (doc: (Document<TOutput> | null)[]) => unknown,
    options?: WatchOptions,
  ): Promise<void> {
    // Create watch stream
    const keys = ids.map((id) => extendKey(this._keys.id, id))
    const stream = this.kv.watch(keys, options)

    // Catch incoming updates
    for await (const entries of stream) {
      // Construct documents
      const docs = await Array.fromAsync(
        entries.map((entry) => this.constructDocument(entry)),
      )

      // Invoke callback function
      await fn(docs)
    }
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
    value: TInput,
    options: SetOptions | undefined,
  ): Promise<CommitResult<TOutput> | DenoKvCommitError> {
    // Create id, document key and parse document value
    const parsed = this._model._transform?.(value as TInput) ??
      this._model.parse(value)

    const docId = id ?? await this._idGenerator(parsed)
    const idKey = extendKey(this._keys.id, docId)
    return await this.setDoc(docId, idKey, parsed, options)
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
  private async setDoc(
    docId: KvId,
    idKey: KvKey,
    value: TOutput,
    options: SetOptions | undefined,
  ): Promise<CommitResult<TOutput> | DenoKvCommitError> {
    // Initialize atomic operation and keys list
    const ids: KvId[] = []
    let docValue: any = value
    const isUint8Array = value instanceof Uint8Array
    const timeId = ulid()
    const operationPool = new AtomicPool()
    const indexOperationPool = new AtomicPool()

    // Check for id collision
    if (!options?.overwrite) {
      operationPool.check({
        key: idKey,
        versionstamp: null,
      })
    }

    // Serialize if enabled
    if (this._isSerialized) {
      const serialized = isUint8Array
        ? value
        : await this._serializer.serialize(value)
      const compressed = await this._serializer.compress(serialized)

      // Set segmented entries
      let index = 0
      for (let i = 0; i < compressed.length; i += UINT8ARRAY_LENGTH_LIMIT) {
        const part = compressed.subarray(i, i + UINT8ARRAY_LENGTH_LIMIT)
        const key = extendKey(this._keys.segment, docId, index)
        ids.push(index)

        operationPool.set(key, part, options)

        // Set history segments if keeps history
        if (this._keepsHistory) {
          const historySegmentKey = extendKey(
            this._keys.historySegment,
            docId,
            timeId,
            index,
          )

          operationPool.set(historySegmentKey, part)
        }

        index++
      }

      // Set serialized document value
      const serializedEntry: SerializedEntry = {
        ids,
        isUint8Array,
      }

      docValue = serializedEntry
    }

    // Set document entry
    operationPool.set(idKey, docValue, options)

    // Set history entry if keeps history
    if (this._keepsHistory) {
      const historyKey = extendKey(this._keys.history, docId, timeId)

      const historyEntry: HistoryEntry<any> = {
        type: "write",
        timestamp: new Date(),
        value: docValue,
      }

      operationPool.set(historyKey, historyEntry)
    }

    // Set indices if is indexable
    if (this._isIndexable) {
      await setIndices(
        docId,
        value as KvObject,
        docValue,
        indexOperationPool,
        this,
        options,
      )
    }

    // Initialize index check, commit result and atomic operation
    let indexCheck = false
    let cr: DenoKvCommitResult | DenoKvCommitError = { ok: false }

    const atomic = options?.batched
      ? new AtomicWrapper(this.kv)
      : this.kv.atomic()

    // Perform index mutations first if operation is batched, else bind all mutations to main operation
    if (options?.batched) {
      const indexAtomic = this.kv.atomic()
      indexOperationPool.bindTo(indexAtomic)
      const indexCr = await indexAtomic.commit()
      indexCheck = indexCr.ok
    } else {
      indexOperationPool.bindTo(atomic)
    }

    // Bind remaining mutations to main operation
    operationPool.bindTo(atomic)

    // Commit operation if not batched or if index setters completed successfully
    if (!options?.batched || indexCheck) {
      cr = await atomic.commit()
    }

    // Handle failed operation
    if (!cr.ok) {
      // Delete any entries upon failed batched operation
      if (options?.batched && indexCheck) {
        const failedAtomic = new AtomicWrapper(this.kv)

        if (this._keepsHistory) {
          const historyKey = extendKey(this._keys.history, docId, timeId)
          failedAtomic.delete(historyKey)
        }

        if (this._isSerialized) {
          const { ids } = docValue as SerializedEntry
          ids.forEach((id) =>
            failedAtomic.delete(extendKey(this._keys.segment, docId, id))
          )
        }

        if (this._isIndexable) {
          await deleteIndices(
            docId,
            value as KvObject,
            failedAtomic,
            this,
          )
        }

        await failedAtomic.commit()
      }

      // Return commit error if no remaining retry attempts
      const retry = options?.retry ?? 0
      if (!retry) {
        return {
          ok: false,
        }
      }

      // Retry operation and decrement retry count
      return await this.setDoc(docId, idKey, value, {
        ...options,
        retry: retry - 1,
      })
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
    data: UpdateData<TOutput, UpdateStrategy>,
    options: UpdateOptions | undefined,
  ): Promise<CommitResult<TOutput> | DenoKvCommitError> {
    // Get document value, delete document entry
    const { value, id } = doc

    // If indexable, check for index collisions and delete exisitng index entries
    if (this._isIndexable) {
      const atomic = this.kv.atomic()

      await checkIndices(
        data as KvObject,
        atomic,
        this,
      )

      const cr = await atomic.commit()

      // If check fails, return commit error
      if (!cr.ok) {
        return {
          ok: false,
        }
      }

      // Delete existing indices
      const doc = await this.find(id)
      if (doc) {
        const atomic = this.kv.atomic()

        await deleteIndices(
          id,
          doc.value as KvObject,
          atomic,
          this,
        )

        await atomic.commit()
      }
    }

    // If serialized, delete existing segment entries
    if (this._isSerialized) {
      const atomic = new AtomicWrapper(this.kv)
      const keyPrefix = extendKey(this._keys.segment, id)
      const iter = this.kv.list({ prefix: keyPrefix })

      for await (const { key } of iter) {
        atomic.delete(key as DenoKvStrictKey)
      }

      await atomic.commit()
    }

    // Determine update strategy and check value type
    const strategy = options?.strategy ?? DEFAULT_UPDATE_STRATEGY
    const isObject = isKvObject(value)

    // Handle different update strategies
    const updated = strategy === "replace"
      ? data as TOutput
      : isObject && strategy === "merge-shallow"
      ? {
        ...value as KvObject,
        ...data as KvObject,
      }
      : deepMerge({ value }, { value: data }, options?.mergeOptions).value

    // Parse updated value
    const parsed = this._model.parse(updated as any)

    // Set new document value
    return await this.setDoc(
      id,
      extendKey(this._keys.id, id),
      parsed,
      {
        ...options,
        overwrite: true,
      },
    )
  }

  /**
   * Construct a document from an entry.
   *
   * @param entry
   * @returns
   */
  private async constructDocument(
    { key, value, versionstamp }: DenoKvEntryMaybe,
  ) {
    if (!versionstamp) {
      return null
    }

    const indexedDocId = (value as IndexDataEntry<any>)?.__id__
    const docId = indexedDocId ?? getDocumentId(key as DenoKvStrictKey)

    if (!docId) {
      return null
    }

    if (this._isSerialized) {
      // Get document parts
      const { ids, isUint8Array } = value as SerializedEntry

      const keys = ids.map((segId) =>
        extendKey(this._keys.segment, docId, segId)
      )

      const docEntries = await kvGetMany(keys, this.kv)

      // Concatenate chunks
      const data = concat(docEntries.map((entry) => entry.value as Uint8Array))

      // Decompress and deserialize
      const serialized = await this._serializer.decompress(data)
      const deserialized = isUint8Array
        ? serialized as TOutput
        : await this._serializer.deserialize<TOutput>(serialized)

      // Return parsed document
      return new Document<TOutput>(this._model, {
        id: docId,
        value: deserialized,
        versionstamp,
      })
    }

    // Remove id from value if indexed entry
    if (typeof indexedDocId !== "undefined") {
      delete (value as any).__id__
    }

    // Return parsed document
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
  private async handleMany<const T>(
    prefixKey: KvKey,
    fn: (doc: Document<TOutput>) => T,
    options: ListOptions<Document<TOutput>> | undefined,
  ) {
    // Create list iterator with given options
    const selector = createListSelector(prefixKey, options)
    const listOptions = createListOptions(options)
    const iter = this.kv.list(selector, listOptions)

    // Initiate lists
    const docs: Document<TOutput>[] = []
    const result: Awaited<T>[] = []
    const errors: unknown[] = []
    const take = options?.take

    // Loop over each document entry
    let count = -1
    const offset = options?.offset ?? 0
    for await (const entry of iter) {
      // Increment count
      count++

      // Skip by offset
      if (count < offset) {
        continue
      }

      // Check if result limit is reached
      if (take && docs.length >= take) {
        break
      }

      // Construct document from entry
      const doc = await this.constructDocument(entry)

      // Continue if document is not constructed
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
        result.push(await fn(doc))
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
   * Delete documents by id.
   *
   * @param ids - List of document ids.
   * @param recordHistory - Whether to record history entry or not.
   * @returns
   */
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
        const entry = await this.kv.get(idKey)
        const doc = await this.constructDocument(entry)

        // Delete document entries
        atomic.delete(idKey)

        if (entry.value) {
          const keys = (entry.value as SerializedEntry).ids.map((segId) =>
            extendKey(this._keys.segment, id, segId)
          )

          keys.forEach((key) => atomic.delete(key))
        }

        if (doc) {
          await deleteIndices(id, doc.value as KvObject, atomic, this)
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
        const { value } = await this.kv.get(idKey)

        // If no value, abort delete
        if (!value) {
          return
        }

        // Delete document entries
        atomic.delete(idKey)
        await deleteIndices(id, value as KvObject, atomic, this)
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
        const { value } = await this.kv.get(idKey)

        // If no value, abort delete
        if (!value) {
          return
        }

        // Delete document entries
        atomic.delete(idKey)

        const keys = (value as SerializedEntry).ids.map((segId) =>
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
