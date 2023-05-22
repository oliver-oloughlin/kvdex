import { Collection, ListOptions, type CommitResult, type FindOptions } from "./collection.ts"
import type { KvId, KvKey, KvValue, Document, Model } from "./kvdb.types.ts"
import { extendKey, generateId, getDocumentId } from "./kvdb.utils.ts"

// Types
export type CheckKvId<T1 extends KvValue, T2> = T1 extends KvId ? T2 : never

export type CheckKeyOf<K, T> = K extends keyof T ? T[K] : never

export type IndexType = "primary" | "secondary"

export type IndexRecord<T extends Model> = {
  [key in keyof T]?: CheckKvId<T[key], IndexType>
}

export type IndexSelection<T1 extends Model, T2 extends IndexRecord<T1>> = {
  [K in keyof T2]: CheckKvId<CheckKeyOf<K, T1>, CheckKeyOf<K, T1>>
}

export type CheckIndexRecord<T1 extends Model, T2> = T2 extends IndexRecord<T1> ? T2 : IndexRecord<T1>

export type IndexDataEntry<T extends Model> = Omit<T, "__id__"> & { __id__: KvId }

// IndexableCollection class
export class IndexableCollection<const T1 extends Model, const T2 extends IndexRecord<T1>> extends Collection<T1> {

  readonly primaryIndexList: string[]
  readonly secondaryIndexList: string[]
  readonly primaryCollectionIndexKey: KvKey
  readonly secondaryCollectionIndexKey: KvKey

  /**
   * Represents a collection of documents stored in the KV store.
   * 
   * Contains methods to work on documents in the collection.
   * 
   * @param kv - The Deno KV instance to be used.
   * @param collectionKey - Key that identifies the collection, an array of Deno.KvKeyPart.
   * @param indexRecord - Record of which fields that should be indexed.
   */
  constructor(kv: Deno.Kv, collectionKey: KvKey, indexRecord?: T2) {
    super(kv, collectionKey)
    this.primaryCollectionIndexKey = extendKey(this.collectionKey, "__index_primary__")
    this.secondaryCollectionIndexKey = extendKey(this.collectionKey, "__index_secondary__")

    const primaryIndexEntries =  Object.entries(indexRecord ?? {}) as [string, undefined | IndexType][]
    this.primaryIndexList = primaryIndexEntries.filter(([_,value]) => value === "primary").map(([key]) => key)

    const secondaryIndexEntries =  Object.entries(indexRecord ?? {}) as [string, undefined | IndexType][]
    this.secondaryIndexList = secondaryIndexEntries.filter(([_,value]) => value === "secondary").map(([key]) => key)
  }

  async add(data: T1) {
    const id = generateId()
    const idKey = extendKey(this.collectionKey, id)

    let atomic = this.kv
      .atomic()
      .check({
        key: idKey,
        versionstamp: null
      })
      .set(idKey, data)

    this.primaryIndexList.forEach(index => {
      const indexValue = data[index] as KvId | undefined
      if (typeof indexValue === "undefined") return

      const indexKey = extendKey(this.primaryCollectionIndexKey, index, indexValue)
      const indexEntry: IndexDataEntry<T1> = { ...data, __id__: id }

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
  }

  async set(id: KvId, data: T1) {
    const idKey = extendKey(this.collectionKey, id)

    let atomic = this.kv
      .atomic()
      .check({
        key: idKey,
        versionstamp: null
      })
      .set(idKey, data)

    this.primaryIndexList.forEach(index => {
      const indexValue = data[index] as KvId | undefined
      if (typeof indexValue === "undefined") return

      const indexKey = extendKey(this.primaryCollectionIndexKey, index, indexValue)
      const indexEntry: IndexDataEntry<T1> = { ...data, __id__: id }
      
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
  }

  /**
   * Find a document by index value.
   * Note that selecting an index that was not defined when creating the collection will always return null.
   * 
   * @param selection - Index values to find document by.
   * @param options - Read options.
   * @returns The document found by selected indexes, or null if not found.
   */
  async findByIndex(selection: IndexSelection<T1, T2>, options?: FindOptions) {
    const indexList = Object.entries(selection).filter(([_,value]) => typeof value !== "undefined") as [string, KvId][]
    if (indexList.length < 1) return null

    const keys = indexList.map(([index, indexValue]) => extendKey(this.primaryCollectionIndexKey, index, indexValue))
    const results = await Promise.all(keys.map(key => this.kv.get<unknown & Pick<IndexDataEntry<T1>, "__id__">>(key, options)))
    const result = results.find(r => r.value !== null && r.versionstamp !== null)

    if (!result || result.value === null || result.versionstamp === null) return null

    const { __id__, ...data } = result.value

    const doc: Document<T1> = {
      id: __id__,
      versionstamp: result.versionstamp,
      value: data as T1
    }

    return doc
  }

  async delete(id: KvId) {
    const idKey = extendKey(this.collectionKey, id)
    const { value, versionstamp } = await this.kv.get<T1>(idKey)
    
    if (value === null || versionstamp === null) return

    let atomic = this.kv.atomic().delete(idKey)

    this.primaryIndexList.forEach(index => {
      const indexValue = value[index] as KvId
      const indexKey = extendKey(this.primaryCollectionIndexKey, index, indexValue)
      atomic = atomic.delete(indexKey)
    })

    await atomic.commit()
  }

  async deleteMany(options?: ListOptions<T1>) {
    const iter = this.kv.list<T1>({ prefix: this.collectionKey }, options)

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
        let atomic = this.kv.atomic().delete(entry.key)

        this.primaryIndexList.forEach(index => {
          const indexValue = value[index] as KvId
          const indexKey = extendKey(this.primaryCollectionIndexKey, index, indexValue)
          atomic = atomic.delete(indexKey)
        })

        await atomic.commit()
      }
    }
  }

}