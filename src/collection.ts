import { COLLECTION_ID_KEY_SUFFIX } from "./constants.ts"
import type {
  CollectionDefinition,
  CollectionKeys,
  CommitResult,
  CountOptions,
  Document,
  EnqueueOptions,
  FindManyOptions,
  FindOptions,
  KvId,
  KvObject,
  KvValue,
  ListOptions,
  QueueMessage,
  QueueMessageHandler,
  UpdateData,
} from "./types.ts"
import {
  extendKey,
  getDocumentId,
  isKvObject,
  keyEq,
} from "./utils.internal.ts"

/**
 * Represents a collection of documents stored in the KV store.
 *
 * Contains methods for working on documents in the collection.
 */
export class Collection<
  const T1 extends KvValue,
  const T2 extends CollectionDefinition<T1>,
> {
  protected kv: Deno.Kv
  readonly keys: CollectionKeys

  /**
   * Create a new collection for handling documents in the KV store.
   *
   * **Example:**
   * ```ts
   * const numbers = new Collection<number>({
   *   kv: await Deno.openKv(),
   *   key: ["numbers"]
   * })
   * ```
   *
   * @param def - Collection definition.
   */
  constructor(def: T2) {
    this.kv = def.kv
    this.keys = {
      baseKey: def.key,
      idKey: extendKey(def.key, COLLECTION_ID_KEY_SUFFIX),
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
    const result = await this.kv.get<T1>(key, options)

    if (result.value === null || result.versionstamp === null) return null

    const doc: Document<T1> = {
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
    const entries = await this.kv.getMany<T1[]>(keys, options)

    const result: Document<T1>[] = []

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
  async add(data: T1) {
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

    const commitResult: CommitResult<T1, typeof id> = cr.ok
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
  async set(id: KvId, data: T1) {
    const key = extendKey(this.keys.idKey, id)

    const cr = await this.kv
      .atomic()
      .check({
        key,
        versionstamp: null,
      })
      .set(key, data)
      .commit()

    const commitResult: CommitResult<T1, typeof id> = cr.ok
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
   * @param ids - IDs of documents to be deleted.
   * @returns A promise that resovles to void.
   */
  async delete(...ids: KvId[]) {
    let atomic = this.kv.atomic()

    ids.forEach((id) => {
      const key = extendKey(this.keys.idKey, id)
      atomic = atomic.delete(key)
    })

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
    data: UpdateData<T1>,
  ): Promise<CommitResult<T1, TId>> {
    const key = extendKey(this.keys.idKey, id)
    const { value, versionstamp } = await this.kv.get<T1>(key)

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
  async addMany(...entries: T1[]) {
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
  async deleteMany(options?: ListOptions<T1>) {
    const iter = this.kv.list<T1>({ prefix: this.keys.idKey }, options)

    for await (const entry of iter) {
      const id = getDocumentId(entry.key)
      if (typeof id === "undefined") continue

      const doc: Document<T1> = {
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
  async getMany(options?: ListOptions<T1>) {
    const iter = this.kv.list<T1>({ prefix: this.keys.idKey }, options)
    const result: Document<T1>[] = []

    for await (const entry of iter) {
      const id = getDocumentId(entry.key)
      if (typeof id === "undefined") continue

      const doc: Document<T1> = {
        id,
        versionstamp: entry.versionstamp,
        value: entry.value,
      }

      if (!options?.filter || options.filter(doc)) {
        result.push(doc)
      }
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
  async forEach(fn: (doc: Document<T1>) => void, options?: ListOptions<T1>) {
    const iter = this.kv.list<T1>({ prefix: this.keys.idKey }, options)

    for await (const entry of iter) {
      const id = getDocumentId(entry.key)
      if (typeof id === "undefined") continue

      const doc: Document<T1> = {
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

  /**
   * Executes a callback function for every document according to the given options.
   *
   * If no options are given, the callback function is executed for all documents in the collection.
   *
   * The results from the callback function are returned as a list.
   *
   * **Example**
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
   * @param options
   * @returns A promise that resovles to an object containing a list of the callback results and the iterator cursor
   */
  async map<const TMapped>(
    fn: (doc: Document<T1>) => TMapped,
    options?: ListOptions<T1>,
  ) {
    const iter = this.kv.list<T1>({ prefix: this.keys.idKey }, options)
    const result: TMapped[] = []

    for await (const entry of iter) {
      const id = getDocumentId(entry.key)
      if (typeof id === "undefined") continue

      const doc: Document<T1> = {
        id,
        versionstamp: entry.versionstamp,
        value: entry.value,
      }

      if (!options?.filter || options.filter(doc)) {
        result.push(fn(doc))
      }
    }

    return {
      result,
      cursor: iter.cursor || undefined,
    }
  }

  /**
   * Counts the number of documents in the collection.
   *
   * **Example:**
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
   * @param options
   * @returns A promise that resolves to a number representing the performed count.
   */
  async count(options?: CountOptions<T1>) {
    const iter = this.kv.list<T1>({ prefix: this.keys.idKey }, options)
    let result = 0

    for await (const entry of iter) {
      const id = getDocumentId(entry.key)
      if (typeof id === "undefined") continue

      const doc: Document<T1> = {
        id,
        versionstamp: entry.versionstamp,
        value: entry.value,
      }

      if (!options?.filter || options.filter(doc)) {
        result++
      }
    }

    return result
  }

  async enqueue(data: unknown, options?: EnqueueOptions) {
    const msg: QueueMessage = {
      collectionKey: this.keys.baseKey,
      data,
    }

    return await this.kv.enqueue(msg, options)
  }

  async listenQueue(handler: QueueMessageHandler) {
    await this.kv.listenQueue(async (msg) => {
      const { collectionKey, data } = msg as QueueMessage

      if (
        Array.isArray(collectionKey) && keyEq(collectionKey, this.keys.baseKey)
      ) {
        await handler(data)
      }
    })
  }
}
