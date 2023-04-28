import type { Model, Document, WithId } from "./model.ts"

export type ListOptions<T extends Model> = Deno.KvListOptions & {
  filter?: (doc: Document<T>) => boolean
}

export type CommitResult<T1 extends Model, T2 extends Deno.KvKeyPart> = {
  versionstamp: Deno.KvEntry<T1>["versionstamp"],
  id: T2
}

export class Collection<T extends Model> {

  private collectionKey: Deno.KvKey

  constructor(collectionKey: Deno.KvKey) {
    this.collectionKey = collectionKey
  }



  /* PUBLIC METHODS */

  /**
   * Finds a document with the given id in the KV store.
   * 
   * @param id - The id of the document to find.
   * @param options - Options for getting the document from the KV store
   * @returns A promise that resolves to the found document, or null if not found.
   */
  async find(id: Deno.KvKeyPart, options?: Parameters<Deno.Kv["get"]>[1]) {
    return await Collection.useKV(async kv => {
      const key = this.getDocumentKeyFromId(id)
      const result = await kv.get<T>(key, options)
      const exists = !!result.value && !!result.versionstamp

      const doc: Document<T> | null = !exists ? null : {
        id,
        versionstamp: result.versionstamp,
        ...result.value
      }

      return doc
    })
  }

  /**
   * Adds a new document to the KV store with a randomely generated id.
   * 
   * @param data
   * @returns A promise that resovles to a commit result containing the document versionstamp and id
   */
  async add(data: T) {
    return await Collection.useKV(async kv => {
      const id = crypto.randomUUID()
      const key = this.getDocumentKeyFromId(id)
      const cr = await kv.set(key, data)
      
      const commitResult: CommitResult<T,typeof id> = {
        versionstamp: cr.versionstamp,
        id
      }

      return commitResult
    })
  }

  /**
   * Adds a new document with the given id to the KV store.
   * 
   * @param document
   * @returns A promise that resovles to a commit result containing the document versionstamp and id
   */
  async set(document: WithId<T>) {
    return await Collection.useKV(async kv => {
      const { id, ...data } = document
      const key = this.getDocumentKeyFromId(id)
      const cr = await kv.set(key, data)

      const commitResult: CommitResult<T, typeof id> = {
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
  async delete(id: Deno.KvKeyPart) {
    return await Collection.useKV(async kv => {
      const key = this.getDocumentKeyFromId(id)
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
    return await Collection.useKV(async kv => {
      const iter = kv.list<T>({ prefix: this.collectionKey }, options)

      for await (const entry of iter) {
        const id = Collection.getIdFromDocumentKey(entry.key)
        if (!id) continue

        const doc: Document<T> = {
          id,
          versionstamp: entry.versionstamp,
          ...entry.value,
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
    return await Collection.useKV(async kv => {
      const iter = kv.list<T>({ prefix: this.collectionKey }, options)
      const result: Document<T>[] = []
  
      for await (const entry of iter) {
        const id = Collection.getIdFromDocumentKey(entry.key)
        if (!id) continue
  
        const doc: Document<T> = {
          id,
          versionstamp: entry.versionstamp,
          ...entry.value
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
    return await Collection.useKV(async kv => {
      const iter = kv.list<T>({ prefix: this.collectionKey }, options)
      
      for await (const entry of iter) {
        const id = Collection.getIdFromDocumentKey(entry.key)
        if (!id) continue
  
        const doc: Document<T> = {
          id,
          versionstamp: entry.versionstamp,
          ...entry.value
        }

        if (!options?.filter || options.filter(doc)) fn(doc)
      }
    })
  }



  /* PRIVATE METHODS */

  private getDocumentKeyFromId(id: Deno.KvKeyPart) {
    return [...this.collectionKey, id]
  }

  private static getIdFromDocumentKey(key: Deno.KvKey) {
    return key.at(-1)
  }

  private static async useKV<T>(fn: (kv: Deno.Kv) => Promise<T>) {
    const kv = await Deno.openKv()
    const result = await fn(kv)
    await kv.close()
    return result
  }

}