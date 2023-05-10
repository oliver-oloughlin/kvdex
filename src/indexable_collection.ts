import { Collection, type CommitResult, type CollectionKey, type FindOptions } from "./collection.ts"
import type { DocumentId, KvValue, Document, Model } from "./kvdb.types.ts"
import { generateId, getDocumentKey, useKV } from "./kvdb.utils.ts"

// Types
export type CheckKey<T1 extends KvValue, T2> = T1 extends DocumentId ? T2 : never

export type CheckKeyOf<K, T> = K extends keyof T ? T[K] : never

export type IndexRecord<T extends Model> = {
  [key in keyof T]?: CheckKey<T[key], true>
}

export type OptionalIndexRecord<T extends Model> = IndexRecord<T> | undefined

export type IndexSelection<T1 extends Model, T2 extends OptionalIndexRecord<T1>> = {
  [K in keyof T2]: CheckKeyOf<K, T2>
}

// Function for creating IndexableCollection
export function indexableCollection<T1 extends Model>(collectionKey: CollectionKey, indexRecord?: IndexRecord<T1>) {
  return new IndexableCollection<T1, typeof indexRecord>(collectionKey, indexRecord)
}

// IndexableCollection class
export class IndexableCollection<const T1 extends Model, const T2 extends OptionalIndexRecord<T1>> extends Collection<T1> {

  private indexRecord: T2 | undefined

  constructor(collectionKey: CollectionKey, indexRecord?: T2) {
    super(collectionKey)
    this.indexRecord = indexRecord
  }

  async add(data: T1) {
    return await useKV(async kv => {
      const id = generateId()
      const idKey = getDocumentKey(this.collectionKey, id)

      let atomic = kv.atomic().set(idKey, data)

      if (this.indexRecord) {
        Object.keys(this.indexRecord).forEach(index => {
          const indexValue = data[index] as DocumentId
          const indexKey = getDocumentKey(this.collectionKey, indexValue)
          atomic = atomic.set(indexKey, data)
        })
      }

      const cr = await atomic.commit()

      const commitResult: CommitResult<T1, typeof id> = cr.ok ? {
        ok: true,
        versionstamp: cr.versionstamp,
        id
      } : {
        ok: false
      }

      return commitResult
    })
  }

  async set(id: DocumentId, data: T1) {
    return await useKV(async kv => {
      const idKey = getDocumentKey(this.collectionKey, id)

      let atomic = kv.atomic().set(idKey, data)

      if (this.indexRecord) {
        Object.keys(this.indexRecord).forEach(index => {
          const indexValue = data[index] as DocumentId
          const indexKey = getDocumentKey(this.collectionKey, indexValue)
          const _data = { id, ...data }
          atomic = atomic.set(indexKey, { id, ...data })
        })
      }

      const cr = await atomic.commit()

      const commitResult: CommitResult<T1, typeof id> = cr.ok ? {
        ok: true,
        versionstamp: cr.versionstamp,
        id
      } : {
        ok: false
      }

      return commitResult
    })
  }

  async findByIndex(selection: IndexSelection<T1, T2>, options?: FindOptions) {
    const indexList = Object.values(selection).filter((value) => typeof value !== "undefined") as DocumentId[]
    if (indexList.length < 1) return null

    return await useKV(async kv => {
      const keys = indexList.map(index => getDocumentKey(this.collectionKey, index))
      const results = await Promise.all(keys.map(key => kv.get<unknown & { id: DocumentId }>(key, options)))
      const result = results.find(r => r.value !== null && r.versionstamp !== null)

      if (!result || result.value === null || result.versionstamp === null) return null

      const { id, ...data } = result.value

      const doc: Document<T1> = {
        id,
        versionstamp: result.versionstamp,
        value: data as T1
      }

      return doc
    })
  }

}

interface Data extends Model {
  age: number
  name: string
  u64: Deno.KvU64
}

const col = indexableCollection<Data>([""], {
  
})