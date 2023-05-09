import type { KvValue, Document, DocumentId } from "./kvdb.types.ts"
import { useKV, getDocumentId, getDocumentKey } from "./kvdb.utils.ts"

// Types
export type ListOptions<T extends KvValue> = Deno.KvListOptions & {
  filter?: (doc: Document<T>) => boolean
}

export type FindOptions = Parameters<Deno.Kv["get"]>[1]

export type FindManyOptions = Parameters<Deno.Kv["getMany"]>[1]

export type CommitResult<T1 extends KvValue, T2 extends DocumentId> = {
  ok: true,
  versionstamp: Document<T1>["versionstamp"],
  id: T2
}

export type CollectionKey = Deno.KvKey

// Create collection method
export function collection<const T extends KvValue>(collectionKey: CollectionKey) {
  return new Collection<T>(collectionKey)
}

// Collection class
export class Collection<const T extends KvValue> {

  readonly collectionKey: CollectionKey

  /**
   * Represents a collection of documents stored in the KV store.
   * 
   * Contains methods to work on documents in the collection.
   * 
   * @param collectionKey - Key that identifies the collection, an array of Deno.KvKeyPart
   */
  constructor(collectionKey: CollectionKey) {
    this.collectionKey = collectionKey
  }

  /**
   * Finds a document with the given id in the KV store.
   * 
   * @param id - Id of the document to find.
   * @param options - Options for reading the document from the KV store.
   * @returns A promise that resolves to the found document, or null if not found.
   */
  async find(id: DocumentId, options?: FindOptions) {
    return await useKV(async kv => {
      const key = getDocumentKey(this.collectionKey, id)
      const result = await kv.get<T>(key, options)
      const exists = !!result.value && !!result.versionstamp

      const doc: Document<T> | null = !exists ? null : {
        id,
        versionstamp: result.versionstamp,
        value: result.value
      }

      return doc
    })
  }

  /**
   * Finds multiple documents with the given array of ids in the KV store.
   * 
   * @param ids - Array of ids of the documents to be found.
   * @param options - Options for reading the documents from the KV store.
   * @returns A promise that resolves to an array of documents.
   */
  async findMany(ids: DocumentId[], options?: FindManyOptions) {
    return await useKV(async kv => {
      const keys = ids.map(id => getDocumentKey(this.collectionKey, id))
      const entries = await kv.getMany<T[]>(keys, options)
      
      const result: Document<T>[] = []

      for (const { key, versionstamp, value } of entries) {
        const id = getDocumentId(key)
        if (!id || !versionstamp || !value) continue

        result.push({
          id,
          versionstamp,
          value
        })
      }

      return result
    })
  }

  /**
   * Adds a new document to the KV store with a randomely generated id.
   * 
   * @param data
   * @returns A promise that resovles to a commit result containing the document versionstamp, id and ok flag.
   */
  async add(data: T) {
    return await useKV(async kv => {
      const id = crypto.randomUUID()
      const key = getDocumentKey(this.collectionKey, id)
      const cr = await kv.set(key, data)
      
      const commitResult: CommitResult<T,typeof id> = {
        ok: true,
        versionstamp: cr.versionstamp,
        id
      }
  
      return commitResult
    })
  }

  /**
   * Adds a new document with the given id to the KV store.
   * 
   * @param data
   * @returns A promise that resovles to a commit result containing the document versionstamp, id and ok flag.
   */
  async set(id: DocumentId, data: T) {
    return await useKV(async kv => {
      const key = getDocumentKey(this.collectionKey, id)
      const cr = await kv.set(key, data)
  
      const commitResult: CommitResult<T, typeof id> = {
        ok: true,
        versionstamp: cr.versionstamp,
        id
      }
  
      return commitResult
    })
  }

  /**
   * Deletes a document with the given id from the KV store.
   * 
   * @param id 
   * @returns A promise that resovles to void
   */
  async delete(id: DocumentId) {
    await useKV(async kv => {
      const key = getDocumentKey(this.collectionKey, id)
      await kv.delete(key)
    })
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
    return await useKV(async kv => {
      const iter = kv.list<T>({ prefix: this.collectionKey }, options)

      for await (const entry of iter) {
        const id = getDocumentId(entry.key)
        if (!id) continue

        const doc: Document<T> = {
          id,
          versionstamp: entry.versionstamp,
          value: entry.value,
        }
        
        if (!options?.filter || options.filter(doc)) await kv.delete(entry.key)
      }
    })
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
    return await useKV(async kv => {
      const iter = kv.list<T>({ prefix: this.collectionKey }, options)
      const result: Document<T>[] = []
  
      for await (const entry of iter) {
        const id = getDocumentId(entry.key)
        if (!id) continue
  
        const doc: Document<T> = {
          id,
          versionstamp: entry.versionstamp,
          value: entry.value
        }
  
        if (!options?.filter || options.filter(doc)) result.push(doc)
      }

      return result
    })
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
    return await useKV(async kv => {
      const iter = kv.list<T>({ prefix: this.collectionKey }, options)
      
      for await (const entry of iter) {
        const id = getDocumentId(entry.key)
        if (!id) continue
  
        const doc: Document<T> = {
          id,
          versionstamp: entry.versionstamp,
          value: entry.value
        }

        if (!options?.filter || options.filter(doc)) fn(doc)
      }
    })
  }

  /**
   * Gets the key for this collection instance
   * 
   * @returns The collection key
   */
  getCollectionKey() {
    return this.collectionKey
  }

}