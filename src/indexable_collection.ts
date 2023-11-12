import { Collection } from "./collection.ts"
import {
  DEFAULT_MERGE_TYPE,
  ID_KEY_PREFIX,
  KVDEX_KEY_PREFIX,
  PRIMARY_INDEX_KEY_PREFIX,
  SECONDARY_INDEX_KEY_PREFIX,
} from "./constants.ts"
import type {
  CheckKeyOf,
  CommitResult,
  CountOptions,
  FindOptions,
  IndexableCollectionKeys,
  IndexableCollectionOptions,
  IndexDataEntry,
  IndexType,
  KvId,
  KvKey,
  KvObject,
  ListOptions,
  Model,
  ParseInsertType,
  PrimaryIndexKeys,
  QueueMessageHandler,
  QueueValue,
  SecondaryIndexKeys,
  SetOptions,
  UpdateData,
  UpdateManyOptions,
  UpdateOptions,
} from "./types.ts"
import {
  allFulfilled,
  checkIndices,
  deepMerge,
  deleteIndices,
  extendKey,
  setIndices,
} from "./utils.ts"
import { Document } from "./document.ts"
import { AtomicWrapper } from "./atomic_wrapper.ts"

/**
 * Create an indexable collection builder function.
 *
 * @example
 * ```ts
 * collection(model<User>(), {
 *   idGenerator: () => ulid(),
 *   indices: {
 *     username: "primary" // unique
 *     age: "secondary" //non-unique
 *   }
 * })
 * ```
 *
 * @param model - Model.
 * @param options - Indexable collection options.
 * @returns An indexable collection builder function.
 */
export function indexableCollection<
  const TBase extends KvObject,
  const TInsert,
  const TOptions extends IndexableCollectionOptions<TBase>,
>(model: Model<TBase, TInsert>, options: TOptions) {
  return (
    kv: Deno.Kv,
    key: KvKey,
    queueHandlers: Map<string, QueueMessageHandler<QueueValue>[]>,
    idempotentListener: () => Promise<void>,
  ) =>
    new IndexableCollection<TBase, TInsert, TOptions>(
      kv,
      key,
      model,
      queueHandlers,
      idempotentListener,
      options,
    )
}

/**
 * Represents a collection of object documents stored in the KV store.
 *
 * Contains methods for working on documents in a collection,
 * including methods exclusive to indexable collections.
 */
export class IndexableCollection<
  const TBase extends KvObject,
  const TInsert,
  const TOptions extends IndexableCollectionOptions<TBase>,
> extends Collection<TBase, TInsert, TOptions> {
  readonly primaryIndexList: string[]
  readonly secondaryIndexList: string[]
  readonly _keys: IndexableCollectionKeys

  constructor(
    kv: Deno.Kv,
    key: KvKey,
    model: Model<TBase, TInsert>,
    queueHandlers: Map<string, QueueMessageHandler<QueueValue>[]>,
    idempotentListener: () => Promise<void>,
    options: TOptions,
  ) {
    // Invoke super constructor
    super(kv, key, model, queueHandlers, idempotentListener, options)

    // Set indexable collection keys
    this._keys = {
      baseKey: extendKey([KVDEX_KEY_PREFIX], ...key),
      idKey: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        ID_KEY_PREFIX,
      ),
      primaryIndexKey: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        PRIMARY_INDEX_KEY_PREFIX,
      ),
      secondaryIndexKey: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        SECONDARY_INDEX_KEY_PREFIX,
      ),
    }

    // Get primary index entries from indices
    const primaryIndexEntries = Object.entries(options.indices) as [
      string,
      undefined | IndexType,
    ][]

    // Set primary index list from primary index entries
    this.primaryIndexList = primaryIndexEntries
      .filter(([_, value]) => value === "primary")
      .map(([key]) => key)

    // Get secondary index entries from indices
    const secondaryIndexEntries = Object.entries(options.indices) as [
      string,
      undefined | IndexType,
    ][]

    // Set secondary index list from secondary index entries
    this.secondaryIndexList = secondaryIndexEntries
      .filter(([_, value]) => value === "secondary")
      .map(([key]) => key)
  }

  /**
   * Find a document by a primary index.
   *
   * @example
   * ```ts
   * // Finds a user document with the username = "oli"
   * const userDoc = await db.users.findByPrimaryIndex("username", "oli")
   * ```
   *
   * @param index - Index to find by.
   * @param value - Index value.
   * @param options - Find options, optional.
   * @returns A promise resolving to the document found by selected index, or null if not found.
   */
  async findByPrimaryIndex<
    const K extends PrimaryIndexKeys<TBase, TOptions["indices"]>,
  >(
    index: K,
    value: CheckKeyOf<K, TBase>,
    options?: FindOptions,
  ) {
    // Create the index key
    const key = extendKey(
      this._keys.primaryIndexKey,
      index as KvId,
      value as KvId,
    )

    // Get index entry
    const result = await this.kv.get<
      unknown & Pick<IndexDataEntry<TBase>, "__id__">
    >(key, options)

    // If no entry is found, return null
    if (result.value === null || result.versionstamp === null) {
      return null
    }

    // Extract the document data
    const { __id__, ...data } = result.value

    // Return document
    return new Document<TBase>(this._model, {
      id: __id__,
      versionstamp: result.versionstamp,
      value: data as TBase,
    })
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
   * @param index - Index to find by.
   * @param value - Index value.
   * @param options - List options, optional.
   * @returns A promise resolving to an object containing the result list and iterator cursor.
   */
  async findBySecondaryIndex<
    const K extends SecondaryIndexKeys<TBase, TOptions["indices"]>,
  >(index: K, value: CheckKeyOf<K, TBase>, options?: ListOptions<TBase>) {
    // Create prefix key
    const prefixKey = extendKey(
      this._keys.secondaryIndexKey,
      index as KvId,
      value as KvId,
    )

    // Add documents to result list by secondary index
    return await this.handleMany(
      prefixKey,
      (doc) => doc,
      options,
    )
  }

  async delete(...ids: KvId[]) {
    // Run delete operations for each id
    await allFulfilled(ids.map(async (id) => {
      // Create idKey, get document value
      const idKey = extendKey(this._keys.idKey, id)
      const { value } = await this.kv.get<TBase>(idKey)

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
   * @param index - Index to delete by.
   * @param value - Index value.
   * @param options - Find options, optional.
   * @returns A promise that resolves to void.
   */
  async deleteByPrimaryIndex<
    const K extends PrimaryIndexKeys<TBase, TOptions["indices"]>,
  >(
    index: K,
    value: CheckKeyOf<K, TBase>,
    options?: FindOptions,
  ) {
    // Create index key
    const key = extendKey(
      this._keys.primaryIndexKey,
      index as KvId,
      value as KvId,
    )

    // Get index entry
    const result = await this.kv.get<
      unknown & Pick<IndexDataEntry<TBase>, "__id__">
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
   * @param index - Index to delete by.
   * @param value - Index value.
   * @param options - List options, optional.
   * @returns A promise that resolves to void.
   */
  async deleteBySecondaryIndex<
    const K extends SecondaryIndexKeys<TBase, TOptions["indices"]>,
  >(index: K, value: CheckKeyOf<K, TBase>, options?: ListOptions<TBase>) {
    // Create prefix key
    const prefixKey = extendKey(
      this._keys.secondaryIndexKey,
      index as KvId,
      value as KvId,
    )

    // Delete documents by secondary index, return iterator cursor
    const { cursor } = await this.handleMany(
      prefixKey,
      (doc) => this.delete(doc.id),
      options,
    )

    return { cursor }
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
   * @param index - Index to update by.
   * @param value - Index value.
   * @param data - Update data to be inserted into document.
   * @param options - Set options, optional.
   * @returns Promise that resolves to a commit result.
   */
  async updateByPrimaryIndex<
    const K extends PrimaryIndexKeys<TBase, TOptions["indices"]>,
  >(
    index: K,
    value: CheckKeyOf<K, TBase>,
    data: UpdateData<ParseInsertType<TBase, TInsert>>,
    options?: UpdateOptions,
  ): Promise<CommitResult<TBase> | Deno.KvCommitError> {
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
   * @param index - Index to update by.
   * @param value - Index value.
   * @param data - Update data to be inserted into document.
   * @param options - Update many options, optional.
   * @returns Promise that resolves to an object containing result list and iterator cursor.
   */
  async updateBySecondaryIndex<
    const K extends SecondaryIndexKeys<TBase, TOptions["indices"]>,
  >(
    index: K,
    value: CheckKeyOf<K, TBase>,
    data: UpdateData<ParseInsertType<TBase, TInsert>>,
    options?: UpdateManyOptions<TBase>,
  ) {
    // Create prefix key
    const prefixKey = extendKey(
      this._keys.secondaryIndexKey,
      index as KvId,
      value as KvId,
    )

    // Update each document by secondary index, add commit result to result list
    return await this.handleMany(
      prefixKey,
      (doc) => this.updateDocument(doc, data, options),
      options,
    )
  }

  async countBySecondaryIndex<
    const K extends SecondaryIndexKeys<TBase, TOptions["indices"]>,
  >(
    index: K,
    value: CheckKeyOf<K, TBase>,
    options?: CountOptions<TBase>,
  ) {
    // Create prefix key
    const prefixKey = extendKey(
      this._keys.secondaryIndexKey,
      index as KvId,
      value as KvId,
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

  async forEachBySecondaryIndex<
    const K extends SecondaryIndexKeys<TBase, TOptions["indices"]>,
  >(
    index: K,
    value: CheckKeyOf<K, TBase>,
    fn: (doc: Document<TBase>) => unknown,
    options?: UpdateManyOptions<TBase>,
  ) {
    // Create prefix key
    const prefixKey = extendKey(
      this._keys.secondaryIndexKey,
      index as KvId,
      value as KvId,
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

  async mapBySecondaryIndex<
    const T,
    const K extends SecondaryIndexKeys<TBase, TOptions["indices"]>,
  >(
    index: K,
    value: CheckKeyOf<K, TBase>,
    fn: (doc: Document<TBase>) => T,
    options?: UpdateManyOptions<TBase>,
  ) {
    // Create prefix key
    const prefixKey = extendKey(
      this._keys.secondaryIndexKey,
      index as KvId,
      value as KvId,
    )

    // Execute callback function for each document entry, return result and cursor
    return await this.handleMany(
      prefixKey,
      (doc) => fn(doc),
      options,
    )
  }

  /** PROTECTED METHODS */

  protected async updateDocument(
    doc: Document<TBase>,
    data: UpdateData<ParseInsertType<TBase, TInsert>>,
    options: UpdateOptions | undefined,
  ): Promise<CommitResult<TBase> | Deno.KvCommitError> {
    // Get document value, delete document entry
    const { value, id } = doc

    // Check for index collisions
    const atomic = checkIndices(data as TBase, this.kv.atomic(), this)
    const cr = await atomic.commit()

    // If check fails, return commit error
    if (!cr.ok) {
      return {
        ok: false,
      }
    }

    // Delete document entry
    await this.delete(id)

    // Merge value and data according to given merge type
    const mergeType = options?.mergeType ?? DEFAULT_MERGE_TYPE

    const merged = mergeType === "shallow"
      ? {
        ...value as KvObject,
        ...data as KvObject,
      }
      : deepMerge(value, data)

    // Set new document value from merged data
    return await this.setDocument(
      id,
      merged as ParseInsertType<TBase, TInsert>,
      options,
      true,
    )
  }

  protected async setDocument(
    id: KvId | null,
    value: ParseInsertType<TBase, TInsert>,
    options: SetOptions | undefined,
    overwrite = false,
  ): Promise<CommitResult<TBase> | Deno.KvCommitError> {
    // Create the document id key and parse document value
    const parsed = this._model.parse(value as TInsert)
    const docId = id ?? this._idGenerator(parsed)
    const idKey = extendKey(this._keys.idKey, docId)

    // Check for index collision
    const indicesCheck = await checkIndices(parsed, this.kv.atomic(), this)
      .commit()

    // If index collision is detected, return commit error
    if (!indicesCheck.ok) {
      return {
        ok: false,
      }
    }

    // Check for id collision
    const idCheck = await this.kv.atomic().check({
      key: idKey,
      versionstamp: null,
    }).commit()

    // If id collision is detected and overwrite is false, return failed operation.
    if (!idCheck.ok) {
      if (!overwrite) {
        return {
          ok: false,
        }
      }

      // Delete existing document before setting new entry
      await this.delete(docId)
    }

    // Create atomic operation with set mutation and versionstamp check
    const atomic = this.kv
      .atomic()
      .set(idKey, parsed, options)

    // Set document indices using atomic operation
    setIndices(docId, parsed, atomic, this, options)

    // Execute the atomic operation
    const cr = await atomic.commit()

    // Retry failed operation if remaining attempts
    const retry = options?.retry ?? 0
    if (!cr.ok && retry > 0) {
      return await this.setDocument(
        docId,
        value,
        { ...options, retry: retry - 1 },
        overwrite,
      )
    }

    // Return commit result or error
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
}
