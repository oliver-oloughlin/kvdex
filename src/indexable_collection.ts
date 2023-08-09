import { Collection } from "./collection.ts"
import {
  COLLECTION_ID_KEY_SUFFIX,
  COLLECTION_PRIMARY_INDEX_KEY_SUFFIX,
  COLLECTION_SECONDARY_INDEX_KEY_SUFFIX,
  KVDEX_KEY_PREFIX,
} from "./constants.ts"
import type {
  CheckKeyOf,
  CommitResult,
  Document,
  FindOptions,
  IndexableCollectionDefinition,
  IndexableCollectionKeys,
  IndexDataEntry,
  IndexType,
  KvId,
  ListOptions,
  Model,
  PrimaryIndexKeys,
  SecondaryIndexKeys,
  UpdateData,
} from "./types.ts"
import {
  checkIndices,
  deleteIndices,
  extendKey,
  getDocumentId,
  setIndices,
} from "./utils.internal.ts"

/**
 * Represents a collection of object documents stored in the KV store.
 *
 * Contains methods for working on documents in a collection,
 * including methods exclusive to indexable collections.
 */
export class IndexableCollection<
  const T1 extends Model,
  const T2 extends IndexableCollectionDefinition<T1>,
> extends Collection<T1, T2> {
  readonly primaryIndexList: string[]
  readonly secondaryIndexList: string[]
  readonly keys: IndexableCollectionKeys

  /**
   * Create a new IndexableCollection for handling object documents in the KV store.
   *
   * **Example:**
   * ```ts
   * const users = new IndexableCollection<User>({
   *   kv: await Deno.openKv(),
   *   key: ["users"],
   *   indices: {
   *     username: "primary",
   *     age: "secondary"
   *   }
   * })
   * ```
   *
   * @param def - Indexable Collection Definition.
   */
  constructor(def: T2) {
    // Invoke super constructor
    super(def)

    // Set indexable collection keys
    this.keys = {
      baseKey: extendKey([KVDEX_KEY_PREFIX], ...def.key),
      idKey: extendKey(
        [KVDEX_KEY_PREFIX],
        ...def.key,
        COLLECTION_ID_KEY_SUFFIX,
      ),
      primaryIndexKey: extendKey(
        [KVDEX_KEY_PREFIX],
        ...def.key,
        COLLECTION_PRIMARY_INDEX_KEY_SUFFIX,
      ),
      secondaryIndexKey: extendKey(
        [KVDEX_KEY_PREFIX],
        ...def.key,
        COLLECTION_SECONDARY_INDEX_KEY_SUFFIX,
      ),
    }

    // Get primary index entries from indices
    const primaryIndexEntries = Object.entries(def.indices) as [
      string,
      undefined | IndexType,
    ][]

    // Set primary index list from primary index entries
    this.primaryIndexList = primaryIndexEntries
      .filter(([_, value]) => value === "primary")
      .map(([key]) => key)

    // Get secondary index entries from indices
    const secondaryIndexEntries = Object.entries(def.indices) as [
      string,
      undefined | IndexType,
    ][]

    // Set secondary index list from secondary index entries
    this.secondaryIndexList = secondaryIndexEntries
      .filter(([_, value]) => value === "secondary")
      .map(([key]) => key)
  }

  async set(id: KvId, data: T1) {
    // Create the document id key
    const idKey = extendKey(this.keys.idKey, id)

    // Create atomic operation with set mutation and version check
    let atomic = this.kv
      .atomic()
      .check({
        key: idKey,
        versionstamp: null,
      })
      .set(idKey, data)

    // Set document indices using atomic operation
    atomic = setIndices(id, data, atomic, this)

    // Execute the atomic operation
    const cr = await atomic.commit()

    // Create a commit result from atomic commit result
    const commitResult: CommitResult<T1> = cr.ok
      ? {
        ok: true,
        versionstamp: cr.versionstamp,
        id,
      }
      : {
        ok: false,
      }

    // Return the commit result
    return commitResult
  }

  /**
   * Find a document by a primary index.
   *
   * **Example:**
   * ```ts
   * // Finds a user document with the username = "oli"
   * const userDoc = await db.users.findByPrimaryIndex("username", "oli")
   * ```
   *
   * @param index - Index to find by.
   * @param value - Index value.
   * @param options - Read options.
   * @returns A promise resolving to the document found by selected index, or null if not found.
   */
  async findByPrimaryIndex<const K extends PrimaryIndexKeys<T1, T2["indices"]>>(
    index: K,
    value: CheckKeyOf<K, T1>,
    options?: FindOptions,
  ) {
    // Create the index key
    const key = extendKey(
      this.keys.primaryIndexKey,
      index as KvId,
      value as KvId,
    )

    // Get index entry
    const result = await this.kv.get<
      unknown & Pick<IndexDataEntry<T1>, "__id__">
    >(key, options)

    // If no entry is found, return null
    if (result.value === null || result.versionstamp === null) {
      return null
    }

    // Extract the document data
    const { __id__, ...data } = result.value

    // Create document
    const doc: Document<T1> = {
      id: __id__,
      versionstamp: result.versionstamp,
      value: data as T1,
    }

    // Return document
    return doc
  }

  /**
   * Find documents by a secondary index. Secondary indices are not
   * unique, and therefore the result is an array of documents.
   * The method takes an optional options argument that can be used for filtering of documents, and pagination.
   *
   * **Example:**
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
   * @param options - List options.
   * @returns A promise resolving to an object containing the result list and iterator cursor.
   */
  async findBySecondaryIndex<
    const K extends SecondaryIndexKeys<T1, T2["indices"]>,
  >(index: K, value: CheckKeyOf<K, T1>, options?: ListOptions<T1>) {
    // Initiate result list
    const result: Document<T1>[] = []

    // Add documents to result list by secondary index
    const { cursor } = await this.handleBySecondaryIndex(
      index,
      value,
      (doc) => result.push(doc),
      options,
    )

    // Return result and current iterator cursor
    return {
      result,
      cursor,
    }
  }

  async delete(...ids: KvId[]) {
    // Run delete operations for each id
    await Promise.all(ids.map(async (id) => {
      // Create idKey, get document value
      const idKey = extendKey(this.keys.idKey, id)
      const { value } = await this.kv.get<T1>(idKey)

      // If no value, abort delete
      if (!value) {
        return
      }

      // Perform delete using atomic operation
      let atomic = this.kv.atomic().delete(idKey)
      atomic = deleteIndices(id, value, atomic, this)
      await atomic.commit()
    }))
  }

  /**
   * Delete a document by a primary index.
   *
   * **Example:**
   * ```ts
   * // Deletes user with username = "oliver"
   * await db.users.deleteByPrimaryIndex("username", "oliver")
   * ```
   *
   * @param index - Index to delete by.
   * @param value - Index value.
   * @param options - Find options.
   * @returns A promise that resolves to void.
   */
  async deleteByPrimaryIndex<
    const K extends PrimaryIndexKeys<T1, T2["indices"]>,
  >(
    index: K,
    value: CheckKeyOf<K, T1>,
    options?: FindOptions,
  ) {
    // Create index key
    const key = extendKey(
      this.keys.primaryIndexKey,
      index as KvId,
      value as KvId,
    )

    // Get index entry
    const result = await this.kv.get<
      unknown & Pick<IndexDataEntry<T1>, "__id__">
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
   * **Example:**
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
   * @param options - List options.
   * @returns A promise that resolves to void.
   */
  async deleteBySecondaryIndex<
    const K extends SecondaryIndexKeys<T1, T2["indices"]>,
  >(index: K, value: CheckKeyOf<K, T1>, options?: ListOptions<T1>) {
    // Delete documents by secondary index, return iterator cursor
    return await this.handleBySecondaryIndex(
      index,
      value,
      (doc) => this.delete(doc.id),
      options,
    )
  }

  async updateByPrimaryIndex<
    const K extends PrimaryIndexKeys<T1, T2["indices"]>,
  >(
    index: K,
    value: CheckKeyOf<K, T1>,
    data: UpdateData<T1>,
  ): Promise<CommitResult<T1>> {
    // Find document by primary index
    const doc = await this.findByPrimaryIndex(index, value)

    // If no document, return result with false flag
    if (!doc) {
      return {
        ok: false,
      }
    }

    // Update document, return result
    return await this.update(doc.id, data)
  }

  async updateBySecondaryIndex<
    const K extends SecondaryIndexKeys<T1, T2["indices"]>,
  >(
    index: K,
    value: CheckKeyOf<K, T1>,
    data: UpdateData<T1>,
    options?: ListOptions<T1>,
  ) {
    // Initiate reuslt list
    const result: CommitResult<T1>[] = []

    // Update each document by secondary index, add commit result to result list
    const { cursor } = await this.handleBySecondaryIndex(
      index,
      value,
      async (doc) => {
        const cr = await this.updateDocument(doc, data)
        result.push(cr)
      },
      options,
    )

    // Return result list and current iterator cursor
    return {
      result,
      cursor,
    }
  }

  /** PROTECTED METHODS */

  protected async updateDocument(
    doc: Document<T1>,
    data: UpdateData<T1>,
  ): Promise<CommitResult<T1>> {
    // Get document value, delete document entry
    const { value, id } = doc

    // Check for index collisions
    const atomic = checkIndices(data, this.kv.atomic(), this)
    const cr = await atomic.commit()

    // If check fails, return result with false flag
    if (!cr.ok) {
      return {
        ok: false,
      }
    }

    // Delete document entry
    await this.delete(id)

    // Set new document value from merged data
    return await this.set(id, {
      ...value,
      ...data,
    })
  }

  /**
   * Perform operations on lists of documents in the collection by secondary index.
   *
   * @param index - Index.
   * @param value - Index value.
   * @param fn - Callback function.
   * @param options - List options
   * @returns - Promise that resolves to object containing iterator cursor.
   */
  protected async handleBySecondaryIndex<
    const K extends SecondaryIndexKeys<T1, T2["indices"]>,
  >(
    index: K,
    value: CheckKeyOf<K, T1>,
    fn: (doc: Document<T1>) => unknown,
    options?: ListOptions<T1>,
  ) {
    // Create index key prefix
    const key = extendKey(
      this.keys.secondaryIndexKey,
      index as KvId,
      value as KvId,
    )

    // Create list iterator and initiate documents list
    const iter = this.kv.list<T1>({ prefix: key }, options)
    const docs: Document<T1>[] = []

    // Loop over document entries
    for await (const { key, value, versionstamp } of iter) {
      // Get document id
      const id = getDocumentId(key)

      // If id is undefined, continue to next entry
      if (typeof id === "undefined") {
        continue
      }

      // Create document
      const doc: Document<T1> = {
        id,
        versionstamp,
        value,
      }

      // Filter document and add to documetns list
      if (!options?.filter || options.filter(doc)) {
        docs.push(doc)
      }
    }

    // Execute callback function for each document
    await Promise.all(docs.map((doc) => fn(doc)))

    // Return current iterator cursor
    return {
      cursor: iter.cursor || undefined,
    }
  }
}
