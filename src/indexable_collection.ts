import { Collection, ListOptions, type CommitResult, type FindOptions } from "./collection.ts"
import type { KvId, KvKey, KvValue, Document, Model } from "./kvdb.types.ts"
import { extendKey, generateId, getDocumentId, useKV } from "./kvdb.utils.ts"

// Types
export type CheckKvId<T1 extends KvValue, T2> = T1 extends KvId ? T2 : never

export type CheckKeyOf<K, T> = K extends keyof T ? T[K] : never

export type IndexRecord<T extends Model> = {
  [key in keyof T]?: CheckKvId<T[key], true>
}

export type IndexSelection<T1 extends Model, T2 extends IndexRecord<T1>> = {
  [K in keyof T2]: CheckKvId<CheckKeyOf<K, T1>, CheckKeyOf<K, T1>>
}

export type CheckIndexRecord<T1 extends Model, T2> = T2 extends IndexRecord<T1> ? T2 : IndexRecord<T1>

export type IndexDataEntry<T extends Model> = T & { id: KvId }

// Function for creating IndexableCollection
export function indexableCollection<const T1 extends Model>(collectionKey: KvKey, indexRecord: IndexRecord<T1>) {
  return new IndexableCollection<T1, typeof indexRecord>(collectionKey, indexRecord)
}

// IndexableCollection class
export class IndexableCollection<const T1 extends Model, const T2 extends IndexRecord<T1>> extends Collection<T1> {

  readonly indexRecord: T2
  readonly collectionIndexKey: KvKey

  constructor(collectionKey: KvKey, indexRecord: T2) {
    super(collectionKey)
    this.collectionIndexKey = extendKey(collectionKey, "__index__")
    this.indexRecord = Object.fromEntries(Object.entries(indexRecord).filter(([_, value]) => !!value)) as T2
  }

  async add(data: T1) {
    return await useKV(async kv => {
      const id = generateId()
      const idKey = extendKey(this.collectionKey, id)

      let atomic = kv.atomic().set(idKey, data)

      Object.keys(this.indexRecord).forEach(index => {
        const indexValue = data[index] as KvId | undefined
        if (typeof indexValue === "undefined") return

        const indexKey = extendKey(this.collectionIndexKey, indexValue)
        const indexEntry: IndexDataEntry<T1> = { id, ...data }

        atomic = atomic
          .set(indexKey, indexEntry)
          .check({
            key: indexKey,
            versionstamp: null
          })
      })

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

  async set(id: KvId, data: T1) {
    return await useKV(async kv => {
      const idKey = extendKey(this.collectionKey, id)

      let atomic = kv.atomic().set(idKey, data)

      Object.keys(this.indexRecord).forEach(index => {
        const indexValue = data[index] as KvId | undefined
        if (typeof indexValue === "undefined") return

        const indexKey = extendKey(this.collectionIndexKey, indexValue)
        const indexEntry: IndexDataEntry<T1> = { id, ...data }
        
        atomic = atomic
          .set(indexKey, indexEntry)
          .check({
            key: indexKey,
            versionstamp: null
          })
      })

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

  /**
   * Find a document by index value.
   * Note that selecting an index that was not defined when creating the collection will always return null.
   * 
   * @param selection - Which indexes to find document by.
   * @param options - Read options.
   * @returns The document found by selected indexes, or null if not found.
   */
  async findByIndex(selection: IndexSelection<T1, T2>, options?: FindOptions) {
    const indexList = Object.values(selection).filter(value => typeof value !== "undefined") as KvId[]
    if (indexList.length < 1) return null

    return await useKV(async kv => {
      const keys = indexList.map(index => extendKey(this.collectionIndexKey, index))
      const results = await Promise.all(keys.map(key => kv.get<unknown & { id: KvId }>(key, options)))
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

  async delete(id: KvId) {
    await useKV(async kv => {
      const idKey = extendKey(this.collectionKey, id)
      const { value, versionstamp } = await kv.get<T1>(idKey)
      
      if (value === null || versionstamp === null) return

      let atomic = kv.atomic().delete(idKey)

      Object.keys(this.indexRecord).forEach(index => {
        const indexValue = value[index] as KvId
        const indexKey = extendKey(this.collectionIndexKey, indexValue)
        atomic = atomic.delete(indexKey)
      })

      await atomic.commit()
    })
  }

  async deleteMany(options?: ListOptions<T1>) {
    return await useKV(async kv => {
      const iter = kv.list<T1>({ prefix: this.collectionKey }, options)

      for await (const entry of iter) {
        const { key, value, versionstamp } = entry
        const id = getDocumentId(key)
        if (typeof id === "undefined") continue

        const doc: Document<T1> = {
          id,
          versionstamp,
          value
        }
        
        if (!options?.filter || options.filter(doc)) {
          let atomic = kv.atomic().delete(entry.key)

          Object.keys(this.indexRecord).forEach(index => {
            const indexValue = value[index] as KvId
            const indexKey = extendKey(this.collectionIndexKey, indexValue)
            atomic = atomic.delete(indexKey)
          })

          await atomic.commit()
        }
      }
    })
  }

}

interface Data extends Model {
  age: number
  name: string
  u64: Deno.KvU64
}

const col = indexableCollection<Data>([""], {
  name: true
})

col.findByIndex({
  
})