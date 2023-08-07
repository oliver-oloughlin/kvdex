import { Collection } from "./collection.ts"
import {
  ATOMIC_OPERATION_MUTATION_LIMIT,
  GET_MANY_KEY_LIMIT,
  LARGE_COLLECTION_STRING_LIMIT,
} from "./constants.ts"
import type {
  AtomicCommitResult,
  CommitResult,
  Document,
  FindManyOptions,
  FindOptions,
  KvId,
  LargeCollectionDefinition,
  LargeDocumentEntry,
  LargeKvValue,
} from "./types.ts"
import { extendKey, getDocumentId } from "./utils.internal.ts"

export class LargeCollection<
  const T1 extends LargeKvValue,
  T2 extends LargeCollectionDefinition<T1>,
> extends Collection<T1, T2> {
  constructor(def: T2) {
    super(def)
  }

  async set(id: Deno.KvKeyPart, data: T1): Promise<CommitResult<T1>> {
    // Stringify data, initiate json parts list, create document id key
    const json = JSON.stringify(data)
    const jsonParts: string[] = []
    const idKey = extendKey(this.keys.idKey, id)

    // Divide json string by string linit, add parts to json parts list
    for (let i = 0; i < json.length; i += LARGE_COLLECTION_STRING_LIMIT) {
      jsonParts.push(json.substring(i, i + LARGE_COLLECTION_STRING_LIMIT))
    }

    // Set start index, initiate commit result and keys lists
    let index = 0
    const setOps: (Promise<AtomicCommitResult>)[] = []
    const keys: Deno.KvKey[] = []

    // Create atomic
    for (
      let i = 0;
      i < jsonParts.length;
      i += ATOMIC_OPERATION_MUTATION_LIMIT
    ) {
      let atomic = this.kv.atomic()
      const subParts = jsonParts.slice(i, i + ATOMIC_OPERATION_MUTATION_LIMIT)

      subParts.forEach((str) => {
        const key = extendKey(idKey, index)
        keys.push(key)

        atomic = atomic
          .set(key, str)
          .check({
            key,
            versionstamp: null,
          })

        index++
      })

      setOps.push(atomic.commit())
    }

    const crs = await Promise.all(setOps)
    const success = crs.length > 0 && crs.every((cr) => cr.ok)

    if (!success) {
      await Promise.all(keys.map((key) => this.kv.delete(key)))

      return {
        ok: false,
      }
    }

    const entry: LargeDocumentEntry = {
      keys,
    }

    const cr = await this.kv
      .atomic()
      .set(idKey, entry)
      .check({
        key: idKey,
        versionstamp: null,
      })
      .commit()

    return cr.ok
      ? {
        ok: true,
        id,
        versionstamp: cr.versionstamp,
      }
      : {
        ok: false,
      }
  }

  async find(
    id: Deno.KvKeyPart,
    options?: FindOptions,
  ): Promise<Document<T1> | null> {
    const idKey = extendKey(this.keys.idKey, id)

    const { value, versionstamp } = await this.kv.get<LargeDocumentEntry>(
      idKey,
      options,
    )

    if (value === null || versionstamp === null) {
      return null
    }

    const { keys } = value
    const slicedKeys: Deno.KvKey[][] = []
    for (let i = 0; i < keys.length; i += GET_MANY_KEY_LIMIT) {
      slicedKeys.push(keys.slice(i, i + GET_MANY_KEY_LIMIT))
    }

    const slicedDocEntries = await Promise.all(slicedKeys.map(async (keys) => {
      return await this.kv.getMany<string[]>(keys, options)
    }))

    const docEntries = slicedDocEntries.flat()

    let json = ""
    docEntries.forEach(({ value }) => {
      if (value) {
        json += value
      }
    })

    if (!json) {
      return null
    }

    return {
      id,
      value: JSON.parse(json) as T1,
      versionstamp,
    }
  }

  async findMany(
    ids: Deno.KvKeyPart[],
    options?: FindManyOptions,
  ): Promise<Document<T1>[]> {
    const idKeys = ids.map((id) => extendKey(this.keys.idKey, id))
    const entries = await this.kv.getMany<LargeDocumentEntry[]>(idKeys, options)

    const docs = await Promise.all(
      entries.map(async ({ key, value, versionstamp }) => {
        const id = getDocumentId(key)

        if (
          typeof id === "undefined" || value === null || versionstamp === null
        ) {
          return null
        }

        const docEntries = await this.kv.getMany<string[]>(value.keys, options)

        let json = ""
        docEntries.forEach(({ value }) => json += value)

        if (!json) {
          return null
        }

        const doc: Document<T1> = {
          id,
          value: JSON.parse(json) as T1,
          versionstamp,
        }

        return doc
      }),
    )

    return docs.filter((doc) => !!doc) as Document<T1>[]
  }

  async delete(...ids: KvId[]): Promise<void> {
    await Promise.all(ids.map(async (id) => {
      const idKey = extendKey(this.keys.idKey, id)
      const { value } = await this.kv.get<LargeDocumentEntry>(idKey)

      if (!value) {
        return
      }

      const { keys } = value
      const deleteOps: (() => Promise<unknown>)[] = []

      for (let i = 0; i < value.keys.length; i += 10) {
        let atomic = this.kv.atomic()

        keys.slice(i, i + 10).forEach((key) => {
          atomic = atomic.delete(key)
        })

        deleteOps.push(() => atomic.commit())
      }

      await Promise.all(deleteOps)
    }))
  }
}
