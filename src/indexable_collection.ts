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
} from "./types.ts"
import {
  deleteIndices,
  extendKey,
  generateId,
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

  async add(data: T1) {
    // Generate id and set the document entry
    const id = generateId()
    return await this.setDocument(id, data)
  }

  async set(id: KvId, data: T1) {
    // Set the document entry
    return await this.setDocument(id, data)
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
    // Create index key prefix
    const key = extendKey(
      this.keys.secondaryIndexKey,
      index as KvId,
      value as KvId,
    )

    // Create list iterator and result list
    const iter = this.kv.list<T1>({ prefix: key }, options)
    const result: Document<T1>[] = []

    // Loop over iterator and add filtered documents to resutl list
    for await (const entry of iter) {
      // Get entry value and document id
      const { key, value, versionstamp } = entry
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

      // Filter document
      if (!options?.filter || options.filter(doc)) {
        result.push(doc)
      }
    }

    // Return result and current iterator cursor
    return {
      result,
      cursor: iter.cursor || undefined,
    }
  }

  async delete(...ids: KvId[]) {
    // Collect document values with id and idKey
    const docs = await Promise.all(
      ids.map(async (id) => {
        const idKey = extendKey(this.keys.idKey, id)
        const { value } = await this.kv.get<T1>(idKey)
        return {
          id,
          idKey,
          value: value,
        }
      }),
    )

    // Initiate an atomic operation
    let atomic = this.kv.atomic()

    // Loop over and delete document entries + index entries
    docs.forEach(({ id, idKey, value }) => {
      // If no value, continue to next entry
      if (!value) {
        return
      }

      // Set delete operations on atomic operation
      atomic = atomic.delete(idKey)
      atomic = deleteIndices(id, value, atomic, this)
    })

    // Commit the atomic operation
    await atomic.commit()
  }

  async update(
    id: KvId,
    data: Partial<T1>,
  ): Promise<CommitResult<T1>> {
    // Create document key, get document value
    const key = extendKey(this.keys.idKey, id)
    const { value, versionstamp } = await this.kv.get<T1>(key)

    // If no value or versionstamp, return errored commit result
    if (value === null || versionstamp === null) {
      return { ok: false }
    }

    // Delete existing document
    await this.delete(id)

    // Merge old data view updated data
    const newData = { ...value, ...data }

    // Set new document data and return commit result
    return await this.setDocument(id, newData)
  }

  async deleteMany(options?: ListOptions<T1>) {
    const iter = this.kv.list<T1>({ prefix: this.keys.idKey }, options)

    for await (const entry of iter) {
      const { key, value, versionstamp } = entry
      const id = getDocumentId(key)
      if (typeof id === "undefined") continue

      const doc: Document<T1> = {
        id,
        versionstamp,
        value,
      }

      if (!options?.filter || options.filter(doc)) {
        let atomic = this.kv.atomic()
        atomic = atomic.delete(entry.key)
        atomic = deleteIndices(id, value, atomic, this)
        await atomic.commit()
      }
    }
    return {
      cursor: iter.cursor || undefined,
    }
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
    const key = extendKey(
      this.keys.primaryIndexKey,
      index as KvId,
      value as KvId,
    )

    const result = await this.kv.get<
      unknown & Pick<IndexDataEntry<T1>, "__id__">
    >(key, options)

    if (result.value === null || result.versionstamp === null) {
      return
    }

    const { __id__ } = result.value

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
    const key = extendKey(
      this.keys.secondaryIndexKey,
      index as KvId,
      value as KvId,
    )

    const iter = this.kv.list<T1>({ prefix: key }, options)
    const deleteIds: KvId[] = []

    for await (const entry of iter) {
      const { key, value, versionstamp } = entry
      const id = getDocumentId(key)
      if (typeof id === "undefined") continue

      const doc: Document<T1> = {
        id,
        versionstamp,
        value,
      }

      if (!options?.filter || options.filter(doc)) {
        deleteIds.push(id)
      }
    }

    await this.delete(...deleteIds)

    return {
      cursor: iter.cursor || undefined,
    }
  }

  /**
   * Set a documetn entry with indices.
   *
   * @param id - Document id.
   * @param data - Docuemnt value.
   * @returns Promise resolving to a commit result.
   */
  private async setDocument(id: KvId, data: T1) {
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
}
