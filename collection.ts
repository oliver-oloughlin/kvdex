import type { Model, Document } from "./model.ts"

export type ListOptions<T extends Model> = Deno.KvListOptions & {
  filter: (doc: Document<T>) => boolean
}

export class Collection<T extends Model> {

  private collectionKey: Deno.KvKey

  constructor(collectionKey: Deno.KvKey) {
    this.collectionKey = collectionKey
  }

  /* PUBLIC METHODS */

  async find(id: Deno.KvKeyPart) {
    return await this.useKV(async kv => {
      const key = this.getDocumentKeyFromId(id)
      const result = await kv.get<T>(key)

      const doc: Document<T> | null = !result.value ? null : {
        id,
        ...result.value
      }

      return doc
    })
  }

  async add(data: T) {
    return await this.useKV(async kv => {
      const id = crypto.randomUUID()
      const key = this.getDocumentKeyFromId(id)
      await kv.set(key, data)
      return id
    })
  }

  async set({ id, ...data }: Document<T>) {
    return await this.useKV(async kv => {
      const key = this.getDocumentKeyFromId(id)
      await kv.set(key, data)
      return id
    })
  }

  async delete(id: Deno.KvKeyPart) {
    return await this.useKV(async kv => {
      const key = this.getDocumentKeyFromId(id)
      await kv.delete(key)
    })
  }

  async deleteMany(options?: ListOptions<T>) {
    return await this.useKV(async kv => {
      const iter = kv.list<T>({ prefix: this.collectionKey }, options)

      for await (const entry of iter) {
        const id = this.getIdFromDocumentKey(entry.key)
        if (!id) continue

        const doc: Document<T> = {
          id,
          ...entry.value
        }
        
        if (!options || options.filter(doc)) await kv.delete(entry.key)
      }
    })
  }

  async getMany(options?: ListOptions<T>) {
    return await this.useKV(async kv => {
      const iter = kv.list<T>({ prefix: this.collectionKey }, options)
      const result: Document<T>[] = []
  
      for await (const entry of iter) {
        const id = this.getIdFromDocumentKey(entry.key)
        if (!id) continue
  
        const doc: Document<T> = {
          id,
          ...entry.value
        }
  
        if (!options || options.filter(doc)) result.push(doc)
      }

      return result
    })
  }

  /* PRIVATE METHODS */

  private getDocumentKeyFromId(id: Deno.KvKeyPart) {
    return [...this.collectionKey, id]
  }

  private getIdFromDocumentKey(key: Deno.KvKey) {
    return key.at(-1)
  }

  private async useKV<T>(fn: (kv: Deno.Kv) => Promise<T>) {
    const kv = await Deno.openKv()
    const result = await fn(kv)
    await kv.close()
    return result
  }

}