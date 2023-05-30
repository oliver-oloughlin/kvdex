import { Collection } from "./collection.ts"
import {
  COLLECTION_INDEX_PRIMARY_KEY_SUFFIX,
  COLLECTION_INDEX_SECONDARY_KEY_SUFFIX,
} from "./constants.ts"
import type {
  CommitResult,
  Document,
  FindOptions,
  IndexDataEntry,
  IndexRecord,
  IndexSelection,
  IndexType,
  KvId,
  KvKey,
  ListOptions,
  Model,
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
 * Contains methods for working on documents in the collection,
 * including exclusive indexing methods.
 */
export class IndexableCollection<
  const T1 extends Model,
  const T2 extends IndexRecord<T1>,
> extends Collection<T1> {
  readonly primaryIndexList: string[]
  readonly secondaryIndexList: string[]
  readonly primaryCollectionIndexKey: KvKey
  readonly secondaryCollectionIndexKey: KvKey

  /**
   * Create a new IndexableCollection for handling object documents in the KV store.
   *
   * @param kv - The Deno KV instance to be used.
   * @param collectionKey - Key that identifies the collection, an array of Deno.KvKeyPart.
   * @param indexRecord - Record of which fields that should be indexed.
   */
  constructor(kv: Deno.Kv, collectionKey: KvKey, indexRecord?: T2) {
    super(kv, collectionKey)

    this.primaryCollectionIndexKey = extendKey(
      collectionKey,
      COLLECTION_INDEX_PRIMARY_KEY_SUFFIX,
    )
    this.secondaryCollectionIndexKey = extendKey(
      collectionKey,
      COLLECTION_INDEX_SECONDARY_KEY_SUFFIX,
    )

    const primaryIndexEntries = Object.entries(indexRecord ?? {}) as [
      string,
      undefined | IndexType,
    ][]

    this.primaryIndexList = primaryIndexEntries.filter(([_, value]) =>
      value === "primary"
    ).map(([key]) => key)

    const secondaryIndexEntries = Object.entries(indexRecord ?? {}) as [
      string,
      undefined | IndexType,
    ][]

    this.secondaryIndexList = secondaryIndexEntries.filter(([_, value]) =>
      value === "secondary"
    ).map(([key]) => key)
  }

  async add(data: T1) {
    const id = generateId()
    const idKey = extendKey(this.collectionIdKey, id)

    let atomic = this.kv
      .atomic()
      .check({
        key: idKey,
        versionstamp: null,
      })
      .set(idKey, data)

    atomic = setIndices(id, data, atomic, this)

    const cr = await atomic.commit()

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

  async set(id: KvId, data: T1) {
    const idKey = extendKey(this.collectionIdKey, id)

    let atomic = this.kv
      .atomic()
      .check({
        key: idKey,
        versionstamp: null,
      })
      .set(idKey, data)

    atomic = setIndices(id, data, atomic, this)

    const cr = await atomic.commit()

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

  async addMany<const TEntries extends [T1, ...T1[]]>(
    ...entries: TEntries
  ): Promise<Deno.KvCommitResult | Deno.KvCommitError> {
    for (const index of this.primaryIndexList) {
      const indexValues = entries.map((data) => JSON.stringify(data[index]))
      const indexValuesSet = new Set(indexValues)

      if (indexValues.length !== indexValuesSet.size) {
        return {
          ok: false,
        }
      }
    }

    let atomic = this.kv.atomic()

    entries.forEach((data) => {
      const id = generateId()
      const idKey = extendKey(this.collectionIdKey, id)

      atomic = atomic
        .check({
          key: idKey,
          versionstamp: null,
        })
        .set(idKey, data)

      atomic = setIndices(id, data, atomic, this)
    })

    return await atomic.commit()
  }

  /**
   * Find a document by index value.
   * Note that selecting an index that was not defined when creating the collection will always return null.
   *
   * **Example:**
   * ```ts
   * // Returns a single result
   * const userByUsername = await db.users.findByPrimaryIndex({
   *   username: "oli"
   * })
   * ```
   *
   * @param selection - Index values to find document by.
   * @param options - Read options.
   * @returns The document found by selected indexes, or null if not found.
   */
  async findByPrimaryIndex(
    selection: IndexSelection<T1, T2>,
    options?: FindOptions,
  ) {
    const indexList = Object.entries(selection).filter(([_, value]) =>
      typeof value !== "undefined"
    ) as [string, KvId][]

    if (indexList.length < 1) return null

    const keys = indexList.map(([index, indexValue]) =>
      extendKey(this.primaryCollectionIndexKey, index, indexValue)
    )

    const results = await Promise.all(
      keys.map((key) =>
        this.kv.get<unknown & Pick<IndexDataEntry<T1>, "__id__">>(key, options)
      ),
    )

    const result = results.find((r) =>
      r.value !== null && r.versionstamp !== null
    )

    if (!result || result.value === null || result.versionstamp === null) {
      return null
    }

    const { __id__, ...data } = result.value

    const doc: Document<T1> = {
      id: __id__,
      versionstamp: result.versionstamp,
      value: data as T1,
    }

    return doc
  }

  /**
   * Finds documents by a given set of secondary indices.
   * If multiple are specified, results are combined.
   *
   * **Example:**
   * ```ts
   * // Returns a list of user documents
   * const usersByAge = await db.users.findBySecondaryIndex({
   *   age: 24
   * })
   * ```
   *
   * @param selection - Selection of secondary indices to find documents by.
   * @param options - Optional list options.
   * @returns An array containing the resulting documents.
   */
  async findBySecondaryIndex(
    selection: IndexSelection<T1, T2>,
    options?: ListOptions<T1>,
  ) {
    const indexList = Object.entries(selection).filter(([_, value]) =>
      typeof value !== "undefined"
    ) as [string, KvId][]
    if (indexList.length < 1) return []

    const result: Document<T1>[] = []
    const keys = indexList.map(([index, indexValue]) =>
      extendKey(this.secondaryCollectionIndexKey, index, indexValue)
    )

    for (const key of keys) {
      const iter = this.kv.list<T1>({ prefix: key }, options)

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
          result.push(doc)
        }
      }
    }

    return result
  }

  async delete(id: KvId) {
    const idKey = extendKey(this.collectionIdKey, id)
    const { value } = await this.kv.get<T1>(idKey)

    if (value === null) return

    let atomic = this.kv.atomic().delete(idKey)

    atomic = deleteIndices(id, value, atomic, this)

    await atomic.commit()
  }

  async update<const TId extends KvId>(
    id: TId,
    data: Partial<T1>,
  ): Promise<CommitResult<T1, TId>> {
    const key = extendKey(this.collectionIdKey, id)
    const { value, versionstamp } = await this.kv.get<T1>(key)

    if (value === null || versionstamp === null) {
      return { ok: false }
    }

    await this.delete(id)

    const newData = { ...value, ...data }

    let atomic = this.kv.atomic().set(key, newData)
    atomic = setIndices(id, newData, atomic, this)
    const result = await atomic.commit()

    if (!result.ok) {
      return {
        ok: false,
      }
    }

    return {
      ok: true,
      id,
      versionstamp: result.versionstamp,
    }
  }

  async deleteMany(options?: ListOptions<T1>) {
    const iter = this.kv.list<T1>({ prefix: this.collectionIdKey }, options)
    let atomic = this.kv.atomic()

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
        atomic = atomic.delete(entry.key)
        atomic = deleteIndices(id, value, atomic, this)
      }

      await atomic.commit()
    }
  }
}
