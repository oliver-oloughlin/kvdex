import { COLLECTION_ID_KEY_SUFFIX } from "./constants.ts"
import type {
  CollectionKeys,
  CommitResult,
  Document,
  FindManyOptions,
  FindOptions,
  KvId,
  KvKey,
  KvObject,
  KvValue,
  ListOptions,
  UpdateData,
} from "./types.ts"
import { extendKey, getDocumentId, isKvObject } from "./utils.internal.ts"

/**
 * Represents a collection of documents stored in the KV store.
 *
 * Contains methods for working on documents in the collection.
 */
export class Collection<const T extends KvValue> {
  protected kv: Deno.Kv
  readonly keys: CollectionKeys

  /**
   * Create a new collection for handling documents in the KV store.
   *
   * @param kv - The Deno KV instance to be used.
   * @param collectionIdKey - Key that identifies the collection, an array of Deno.KvKeyPart.
   */
  constructor(kv: Deno.Kv, collectionKey: KvKey) {
    this.kv = kv
    this.keys = {
      baseKey: collectionKey,
      idKey: extendKey(collectionKey, COLLECTION_ID_KEY_SUFFIX),
    }
  }

  /**
   * Finds a document with the given id in the KV store.
   *
   * **Example:**
   * ```ts
   * const userDoc1 = await db.users.find("user1")
   *
   * const userDoc2 = await db.users.find("user2", {
   *   consistency: "eventual" // "strong" by default
   * })
   * ```
   *
   * @param id - Id of the document to find.
   * @param options - Options for reading the document from the KV store.
   * @returns A promise that resolves to the found document, or null if not found.
   */
  async find(id: KvId, options?: FindOptions) {
    const key = extendKey(this.keys.idKey, id)
    const result = await this.kv.get<T>(key, options)

    if (result.value === null || result.versionstamp === null) return null

    const doc: Document<T> = {
      id,
      versionstamp: result.versionstamp,
      value: result.value,
    }

    return doc
  }

  /**
   * Finds multiple documents with the given array of ids in the KV store.
   *
   * **Example:**
   * ```ts
   * const userDocs1 = await db.users.findMany(["user1", "user2", "user3"])
   *
   * const userDocs2 = await db.users.findMany(["user1", "user2", "user3"], {
   *   consistency: "eventual" // "strong" by default
   * })
   * ```
   *
   * @param ids - Array of ids of the documents to be found.
   * @param options - Options for reading the documents from the KV store.
   * @returns A promise that resolves to an array of documents.
   */
  async findMany(ids: KvId[], options?: FindManyOptions) {
    const keys = ids.map((id) => extendKey(this.keys.idKey, id))
    const entries = await this.kv.getMany<T[]>(keys, options)

    const result: Document<T>[] = []

    for (const { key, versionstamp, value } of entries) {
      const id = getDocumentId(key)
      if (
        typeof id === "undefined" || versionstamp === null || value === null
      ) continue

      result.push({
        id,
        versionstamp,
        value,
      })
    }

    return result
  }

  /**
   * Adds a new document to the KV store with a randomely generated id.
   *
   * **Example:**
   * ```ts
   * const result = await db.users.add({
   *   username: "oli",
   *   age: 24
   * })
   * ```
   *
   * @param data
   * @returns A promise that resovles to a commit result containing the document versionstamp, id and ok flag.
   */
  async add(data: T) {
    const id = crypto.randomUUID()
    const key = extendKey(this.keys.idKey, id)

    const cr = await this.kv
      .atomic()
      .check({
        key,
        versionstamp: null,
      })
      .set(key, data)
      .commit()

    const commitResult: CommitResult<T, typeof id> = cr.ok
      ? {
        ok: true,
        versionstamp: cr.versionstamp,
        id,
      }
      : {
        ok: false,
      }

    return commitResult
  }

  /**
   * Adds a new document with the given id to the KV store.
   *
   * **Example:**
   * ```ts
   * const result = await db.users.add("oliver", {
   *   username: "oli",
   *   age: 24
   * })
   * ```
   *
   * @param data
   * @returns A promise that resovles to a commit result containing the document versionstamp, id and ok flag.
   */
  async set(id: KvId, data: T) {
    const key = extendKey(this.keys.idKey, id)

    const cr = await this.kv
      .atomic()
      .check({
        key,
        versionstamp: null,
      })
      .set(key, data)
      .commit()

    const commitResult: CommitResult<T, typeof id> = cr.ok
      ? {
        ok: true,
        versionstamp: cr.versionstamp,
        id,
      }
      : {
        ok: false,
      }

    return commitResult
  }

  /**
   * Deletes one or more documents with the given ids from the KV store.
   *
   * **Example:**
   * ```ts
   * await db.users.delete("oliver")
   * 
   * await db.users.delete("user1", "user2", "user3")
   * ```
   *
   * @param id
   * @returns A promise that resovles to void
   */
  async delete(...ids: [KvId, ...KvId[]]) {
    await Promise.all(ids.map(async (id) => {
      const key = extendKey(this.keys.idKey, id)
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
   * **Example:**
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
   * @returns
   */
  async update<const TId extends KvId>(
    id: TId,
    data: UpdateData<T>,
  ): Promise<CommitResult<T, TId>> {
    const key = extendKey(this.keys.idKey, id)
    const { value, versionstamp } = await this.kv.get<T>(key)

    if (value === null || versionstamp === null) {
      return { ok: false }
    }

    if (isKvObject(value)) {
      const _value = value as KvObject
      const _data = data as KvObject
      const newData = { ..._value, ..._data }
      const result = await this.kv.set(key, newData)

      return {
        ok: true,
        id,
        versionstamp: result.versionstamp,
      }
    }

    const result = await this.kv.set(key, data)

    return {
      ok: true,
      id,
      versionstamp: result.versionstamp,
    }
  }

  /**
   * Adds multiple documents to the KV store.
   *
   * **Example:**
   * ```ts
   * // Adds 5 new document entries to the KV store.
   * await results = await db.numbers.addMany(1, 2, 3, 4, 5)
   *
   * // Only adds the first entry, as "username" is defined as a primary index and cannot have duplicates
   * await results = await db.users.addMany(
   *   {
   *     username: "oli",
   *     age: 24
   *   },
   *   {
   *     username: "oli",
   *     age: 56
   *   }
   * )
   * ```
   *
   * @param entries - Data entries to be added.
   * @returns A promise that resolves to a list of Deno.KvCommitResult or Deno.KvCommitError objects
   */
  async addMany(...entries: [T, ...T[]]) {
    return await Promise.all(entries.map((data) => this.add(data)))
  }

  /**
   * Deletes multiple documents from the KV store according to the given options.
   *
   * If no options are given, all documents are deleted.
   *
   * **Example:**
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
   * @param options
   * @returns A promise that resovles to an object containing the iterator cursor
   */
  async deleteMany(options?: ListOptions<T>) {
    const iter = this.kv.list<T>({ prefix: this.keys.idKey }, options)

    for await (const entry of iter) {
      const id = getDocumentId(entry.key)
      if (typeof id === "undefined") continue

      const doc: Document<T> = {
        id,
        versionstamp: entry.versionstamp,
        value: entry.value,
      }

      if (!options?.filter || options.filter(doc)) {
        await this.kv.delete(entry.key)
      }
    }
    return {
      cursor: iter.cursor || undefined,
    }
  }

  /**
   * Retrieves multiple documents from the KV store according to the given options.
   *
   * If no options are given, all documents are retrieved.
   *
   * **Example:**
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
   * @param options
   * @returns A promise that resovles to an object containing a list of the retrieved documents and the iterator cursor
   */
  async getMany(options?: ListOptions<T>) {
    const iter = this.kv.list<T>({ prefix: this.keys.idKey }, options)
    const result: Document<T>[] = []

    for await (const entry of iter) {
      const id = getDocumentId(entry.key)
      if (typeof id === "undefined") continue

      const doc: Document<T> = {
        id,
        versionstamp: entry.versionstamp,
        value: entry.value,
      }

      if (!options?.filter || options.filter(doc)) result.push(doc)
    }

    return {
      result,
      cursor: iter.cursor || undefined,
    }
  }

  /**
   * Executes a callback function for every document according to the given options.
   *
   * If no options are given, the callback function is executed for all documents in the collection.
   *
   * **Example:**
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
   * @param fn
   * @param options
   * @returns A promise that resovles to an object containing the iterator cursor
   */
  async forEach(fn: (doc: Document<T>) => void, options?: ListOptions<T>) {
    const iter = this.kv.list<T>({ prefix: this.keys.idKey }, options)

    for await (const entry of iter) {
      const id = getDocumentId(entry.key)
      if (typeof id === "undefined") continue

      const doc: Document<T> = {
        id,
        versionstamp: entry.versionstamp,
        value: entry.value,
      }

      if (!options?.filter || options.filter(doc)) fn(doc)
    }
    return {
      cursor: iter.cursor || undefined,
    }
  }
}
