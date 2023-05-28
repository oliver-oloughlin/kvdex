import { COLLECTION_ID_KEY_SUFFIX } from "./constants.ts"
import type {
  CommitResult,
  Document,
  FindManyOptions,
  FindOptions,
  KvId,
  KvKey,
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
  readonly collectionIdKey: KvKey

  /**
   * Create a new collection for handling documents in the KV store.
   *
   * @param kv - The Deno KV instance to be used.
   * @param collectionIdKey - Key that identifies the collection, an array of Deno.KvKeyPart.
   */
  constructor(kv: Deno.Kv, collectionKey: KvKey) {
    this.kv = kv
    this.collectionIdKey = extendKey(collectionKey, COLLECTION_ID_KEY_SUFFIX)
  }

  /**
   * Finds a document with the given id in the KV store.
   *
   * @param id - Id of the document to find.
   * @param options - Options for reading the document from the KV store.
   * @returns A promise that resolves to the found document, or null if not found.
   */
  async find(id: KvId, options?: FindOptions) {
    const key = extendKey(this.collectionIdKey, id)
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
   * @param ids - Array of ids of the documents to be found.
   * @param options - Options for reading the documents from the KV store.
   * @returns A promise that resolves to an array of documents.
   */
  async findMany(ids: KvId[], options?: FindManyOptions) {
    const keys = ids.map((id) => extendKey(this.collectionIdKey, id))
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
   * @param data
   * @returns A promise that resovles to a commit result containing the document versionstamp, id and ok flag.
   */
  async add(data: T) {
    const id = crypto.randomUUID()
    const key = extendKey(this.collectionIdKey, id)

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
   * @param data
   * @returns A promise that resovles to a commit result containing the document versionstamp, id and ok flag.
   */
  async set(id: KvId, data: T) {
    const key = extendKey(this.collectionIdKey, id)

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
   * Deletes a document with the given id from the KV store.
   *
   * @param id
   * @returns A promise that resovles to void
   */
  async delete(id: KvId) {
    const key = extendKey(this.collectionIdKey, id)
    await this.kv.delete(key)
  }

  async update(id: KvId, data: UpdateData<T>): Promise<CommitResult<T, typeof id>> {
    const key = extendKey(this.collectionIdKey, id)
    const { value, versionstamp } = await this.kv.get<T>(key)

    if (value === null || versionstamp === null) {
      return { ok: false }
    }

    if (isKvObject(value)) {
      // TODO: Deep merge value and data, set new value
    }

    const result = await this.kv.set(key, data)

    return {
      ok: true,
      id,
      versionstamp: result.versionstamp
    }
  }

  /**
   * Deletes multiple documents from the KV store according to the given options.
   *
   * If no options are given, all documents are deleted.
   *
   * @param options
   * @returns A promise that resovles to void
   */
  async deleteMany(options?: ListOptions<T>) {
    const iter = this.kv.list<T>({ prefix: this.collectionIdKey }, options)

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
  }

  /**
   * Retrieves multiple documents from the KV store according to the given options.
   *
   * If no options are given, all documents are retrieved.
   *
   * @param options
   * @returns A promise that resovles to a list of the retrieved documents
   */
  async getMany(options?: ListOptions<T>) {
    const iter = this.kv.list<T>({ prefix: this.collectionIdKey }, options)
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

    return result
  }

  /**
   * Executes a callback function for every document according to the given options.
   *
   * If no options are given, the callback function is executed for all documents in the collection.
   *
   * @param fn
   * @param options
   * @returns A promise that resolves to void
   */
  async forEach(fn: (doc: Document<T>) => void, options?: ListOptions<T>) {
    const iter = this.kv.list<T>({ prefix: this.collectionIdKey }, options)

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
  }
}
