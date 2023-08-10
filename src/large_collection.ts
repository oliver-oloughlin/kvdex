import { Collection } from "./collection.ts"
import {
  COLLECTION_ID_KEY_SUFFIX,
  COLLECTION_SEGMENT_KEY_SUFFIX,
  KVDEX_KEY_PREFIX,
  LARGE_COLLECTION_STRING_LIMIT,
} from "./constants.ts"
import type {
  CommitResult,
  Document,
  FindManyOptions,
  FindOptions,
  KvId,
  KvKey,
  LargeCollectionKeys,
  LargeCollectionOptions,
  LargeDocumentEntry,
  LargeKvValue,
  ListOptions,
} from "./types.ts"
import {
  extendKey,
  getDocumentId,
  kvGetMany,
  useAtomics,
} from "./utils.internal.ts"

export class LargeCollection<
  const T1 extends LargeKvValue,
  T2 extends LargeCollectionOptions<T1>,
> extends Collection<T1, T2> {
  readonly keys: LargeCollectionKeys

  constructor(kv: Deno.Kv, key: KvKey, def: T2) {
    // Invoke super constructor
    super(kv, key, def)

    // Set large collection keys
    this.keys = {
      baseKey: extendKey([KVDEX_KEY_PREFIX], ...key),
      idKey: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        COLLECTION_ID_KEY_SUFFIX,
      ),
      segmentKey: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        COLLECTION_SEGMENT_KEY_SUFFIX,
      ),
    }
  }

  async set(id: Deno.KvKeyPart, data: T1): Promise<CommitResult<T1>> {
    // Create document id key
    const idKey = extendKey(this.keys.idKey, id)

    // Check if id already exists
    const check = await this.kv
      .atomic()
      .check({
        key: idKey,
        versionstamp: null,
      })
      .commit()

    // If id exists, return result with false flag
    if (!check.ok) {
      return {
        ok: false,
      }
    }

    // Stringify data and initialize json parts list
    const json = JSON.stringify(data)
    const jsonParts: string[] = []

    // Divide json string by string limit, add parts to json parts list
    for (let i = 0; i < json.length; i += LARGE_COLLECTION_STRING_LIMIT) {
      jsonParts.push(json.substring(i, i + LARGE_COLLECTION_STRING_LIMIT))
    }

    // Set start index, initiate commit result and keys lists
    let index = 0
    const keys: KvKey[] = []

    // Execute set operations for json parts, capture keys and commit results
    const crs = await useAtomics(this.kv, jsonParts, (str, atomic) => {
      const key = extendKey(this.keys.segmentKey, id, index)
      keys.push(key)
      index++

      return atomic
        .set(key, str)
    })

    // Determine whether setting json parts was successful
    const success = crs.length > 0 && crs.every((cr) => cr.ok)

    // If not successful, delete all json part entries
    if (!success) {
      await Promise.all(keys.map((key) => this.kv.delete(key)))

      return {
        ok: false,
      }
    }

    // Create large document entry
    const entry: LargeDocumentEntry = {
      keys,
    }

    // Set large document entry
    const cr = await this.kv
      .atomic()
      .set(idKey, entry)
      .commit()

    // If not successful, delete all json part entries
    if (!cr.ok) {
      await Promise.all(keys.map((key) => this.kv.delete(key)))

      return {
        ok: false,
      }
    }

    // Return commit result
    return {
      ok: true,
      id,
      versionstamp: cr.versionstamp,
    }
  }

  async find(
    id: Deno.KvKeyPart,
    options?: FindOptions,
  ): Promise<Document<T1> | null> {
    // Create documetn id key
    const idKey = extendKey(this.keys.idKey, id)

    // Get large document entry
    const { value, versionstamp } = await this.kv.get<LargeDocumentEntry>(
      idKey,
      options,
    )

    // If no value, return null
    if (value === null || versionstamp === null) {
      return null
    }

    // Get document json parts
    const { keys } = value
    const docEntries = await kvGetMany<string>(keys, this.kv)

    // Construct document json from json parts
    let json = ""
    docEntries.forEach(({ value }) => {
      if (value) {
        json += value
      }
    })

    // This should never happen
    if (!json) {
      await this.delete(id)
      return null
    }

    // Create and return document
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
    // Map ids to document id keys
    const idKeys = ids.map((id) => extendKey(this.keys.idKey, id))

    // Get large document entries
    const entries = await kvGetMany<LargeDocumentEntry>(
      idKeys,
      this.kv,
      options,
    )

    // Initiate result list
    const result: Document<T1>[] = []

    // Get documents from large document entries
    await Promise.all(
      entries.map(async ({ key, value, versionstamp }) => {
        // Get document id
        const id = getDocumentId(key)

        // If no id or value, continue to next entry
        if (
          typeof id === "undefined" || value === null || versionstamp === null
        ) {
          return
        }

        // Get documetn json parts
        const docEntries = await kvGetMany<string>(value.keys, this.kv, options)

        // Construct document json from json parts
        let json = ""
        docEntries.forEach(({ value }) => {
          if (value) {
            json += value
          }
        })

        // This should never happen
        if (!json) {
          await this.delete(id)
          return
        }

        // Create document
        const doc: Document<T1> = {
          id,
          value: JSON.parse(json) as T1,
          versionstamp,
        }

        // Add document to result list
        result.push(doc)
      }),
    )

    // Return found documents
    return result
  }

  async delete(...ids: KvId[]): Promise<void> {
    // Perform delete for each id
    await Promise.all(ids.map(async (id) => {
      // Create document id key, get documetn value
      const idKey = extendKey(this.keys.idKey, id)
      const { value } = await this.kv.get<LargeDocumentEntry>(idKey)

      // If no value, abort delete
      if (!value) {
        return
      }

      // Delete document entry
      await this.kv.delete(idKey)

      // Delete document parts
      await useAtomics(this.kv, value.keys, (key, atomic) => {
        return atomic.delete(key)
      })
    }))
  }

  protected async handleMany(
    fn: (doc: Document<T1>) => unknown,
    options?: ListOptions<T1>,
  ): Promise<{ cursor: string | undefined }> {
    // Create list iterotr with given options
    const iter = this.kv.list<LargeDocumentEntry[]>(
      { prefix: this.keys.idKey },
      options,
    )

    // Initiate documents list
    const docs: Document<T1>[] = []

    // Loop over each document entry
    for await (const { key } of iter) {
      // Get document id, continue to next entry if undefined
      const id = getDocumentId(key)
      if (typeof id === "undefined") {
        continue
      }

      // Get the constructed document entry
      const doc = await this.find(id)

      // If no document is found, continue to next entry
      if (!doc) {
        continue
      }

      // Filter document and add to documents list
      if (!options?.filter || options.filter(doc)) {
        docs.push(doc)
      }
    }

    // Execute callback function for each document
    await Promise.all(docs.map((doc) => fn(doc)))

    // Return current iterator cursor
    return {
      cursor: iter.cursor || undefined,
    }
  }
}
