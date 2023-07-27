import { Collection } from "./collection.ts"
import {
  COLLECTION_ID_KEY_SUFFIX,
  COLLECTION_PRIMARY_INDEX_KEY_SUFFIX,
  COLLECTION_SECONDARY_INDEX_KEY_SUFFIX,
} from "./constants.ts"
import type {
  CheckKeyOf,
  CommitResult,
  Document,
  FindOptions,
  IndexableCollectionDefinition,
  IndexableCollectionKeys,
  IndexDataEntry,
  IndexType,
  KvId,
  ListOptions,
  Model,
  PrimaryIndexKeys,
  SecondaryIndexKeys,
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
 * Contains methods for working on documents in a collection,
 * including methods exclusive to indexable collections.
 */
export class IndexableCollection<
  const T1 extends Model,
  const T2 extends IndexableCollectionDefinition<T1>,
> extends Collection<T1, T2> {
  readonly primaryIndexList: string[]
  readonly secondaryIndexList: string[]
  readonly keys: IndexableCollectionKeys

  /**
   * Create a new IndexableCollection for handling object documents in the KV store.
   *
   * **Example:**
   * ```ts
   * const users = new IndexableCollection<User>({
   *   kv: await Deno.openKv(),
   *   key: ["users"],
   *   indices: {
   *     username: "primary",
   *     age: "secondary"
   *   }
   * })
   * ```
   *
   * @param def - Indexable Collection Definition.
   */
  constructor(def: T2) {
    super(def)

    this.keys = {
      baseKey: def.key,
      idKey: extendKey(def.key, COLLECTION_ID_KEY_SUFFIX),
      primaryIndexKey: extendKey(
        def.key,
        COLLECTION_PRIMARY_INDEX_KEY_SUFFIX,
      ),
      secondaryIndexKey: extendKey(
        def.key,
        COLLECTION_SECONDARY_INDEX_KEY_SUFFIX,
      ),
    }

    const primaryIndexEntries = Object.entries(def.indices) as [
      string,
      undefined | IndexType,
    ][]

    this.primaryIndexList = primaryIndexEntries.filter(([_, value]) =>
      value === "primary"
    ).map(([key]) => key)

    const secondaryIndexEntries = Object.entries(def.indices) as [
      string,
      undefined | IndexType,
    ][]

    this.secondaryIndexList = secondaryIndexEntries.filter(([_, value]) =>
      value === "secondary"
    ).map(([key]) => key)
  }

  async add(data: T1) {
    const id = generateId()
    const idKey = extendKey(this.keys.idKey, id)

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
    const idKey = extendKey(this.keys.idKey, id)

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

  /**
   * Find a document by a primary index.
   *
   * **Example:**
   * ```ts
   * // Finds a user document with the username = "oli"
   * const userDoc = await db.users.findByPrimaryIndex("username", "oli")
   * ```
   *
   * @param index - Index to find by.
   * @param value - Index value.
   * @param options - Read options.
   * @returns A promise resolving to the document found by selected index, or null if not found.
   */
  async findByPrimaryIndex<const K extends PrimaryIndexKeys<T1, T2["indices"]>>(
    index: K,
    value: CheckKeyOf<K, T1>,
    options?: FindOptions,
  ) {
    const key = extendKey(
      this.keys.primaryIndexKey,
      index as KvId,
      value as KvId,
    )

    const result = await this.kv.get<
      unknown & Pick<IndexDataEntry<T1>, "__id__">
    >(key, options)

    if (result.value === null || result.versionstamp === null) {
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
   * Find documents by a secondary index.
   *
   * **Example:**
   * ```ts
   * // Returns all users with age = 24
   * const { result } = await db.users.findBySecondaryIndex("age", 24)
   * ```
   *
   * @param index - Index to find by.
   * @param value - Index value.
   * @param options - List options.
   * @returns A promise resolving to an object containing the result list and iterator cursor.
   */
  async findBySecondaryIndex<
    const K extends SecondaryIndexKeys<T1, T2["indices"]>,
  >(
    index: K,
    value: CheckKeyOf<K, T1>,
    options?: ListOptions<T1>,
  ) {
    const key = extendKey(
      this.keys.secondaryIndexKey,
      index as KvId,
      value as KvId,
    )

    const iter = this.kv.list<T1>({ prefix: key }, options)
    const result: Document<T1>[] = []

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

    return {
      result,
      cursor: iter.cursor || undefined,
    }
  }

  async delete(...ids: KvId[]) {
    await Promise.all(ids.map(async (id) => {
      const idKey = extendKey(this.keys.idKey, id)
      const { value } = await this.kv.get<T1>(idKey)

      if (value === null) {
        return
      }

      let atomic = this.kv.atomic().delete(idKey)
      atomic = deleteIndices(id, value, atomic, this)

      await atomic.commit()
    }))
  }

  async update<const TId extends KvId>(
    id: TId,
    data: Partial<T1>,
  ): Promise<CommitResult<T1, TId>> {
    const key = extendKey(this.keys.idKey, id)
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
    const iter = this.kv.list<T1>({ prefix: this.keys.idKey }, options)
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
    return {
      cursor: iter.cursor || undefined,
    }
  }
}
