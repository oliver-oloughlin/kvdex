import { Collection } from "./collection.ts"
import {
  ID_KEY_PREFIX,
  KVDEX_KEY_PREFIX,
  LARGE_COLLECTION_STRING_LIMIT,
  SEGMENT_KEY_PREFIX,
} from "./constants.ts"
import type {
  CommitResult,
  FindManyOptions,
  FindOptions,
  KvId,
  KvKey,
  LargeCollectionKeys,
  LargeCollectionOptions,
  LargeDocumentEntry,
  LargeKvValue,
  ListOptions,
  ParserModel,
  QueueMessageHandler,
  QueueValue,
  SetOptions,
} from "./types.ts"
import {
  allFulfilled,
  createListSelector,
  extendKey,
  getDocumentId,
  kvGetMany,
  parseDocumentValue,
  useAtomics,
} from "./utils.ts"
import { Document } from "./document.ts"
import { CorruptedDocumentDataError } from "./errors.ts"
import { Model } from "./model.ts"

export function largeCollection<T1 extends LargeKvValue>(
  model: Model<T1> | ParserModel<T1>,
  options?: LargeCollectionOptions<T1>,
) {
  return (
    kv: Deno.Kv,
    key: KvKey,
    queueHandlers: Map<string, QueueMessageHandler<QueueValue>[]>,
    idempotentListener: () => void,
  ) =>
    new LargeCollection<T1, LargeCollectionOptions<T1>>(
      kv,
      key,
      model,
      queueHandlers,
      idempotentListener,
      options,
    )
}

export class LargeCollection<
  const T1 extends LargeKvValue,
  T2 extends LargeCollectionOptions<T1>,
> extends Collection<T1, T2> {
  readonly _keys: LargeCollectionKeys

  /**
   * Create a new LargeCollection for handling large documents in the KV store.
   *
   * @example
   * ```ts
   * const kv = await Deno.openKv()
   * const largeStrings = new LargeCollection<string>(kv, ["largeStrings"])
   * ```
   *
   * @param kv
   * @param key
   * @param options
   */
  constructor(
    kv: Deno.Kv,
    key: KvKey,
    model: Model<T1> | ParserModel<T1>,
    queueHandlers: Map<string, QueueMessageHandler<QueueValue>[]>,
    idempotentListener: () => void,
    options?: T2,
  ) {
    // Invoke super constructor
    super(kv, key, model, queueHandlers, idempotentListener, options)

    // Set large collection keys
    this._keys = {
      baseKey: extendKey([KVDEX_KEY_PREFIX], ...key),
      idKey: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        ID_KEY_PREFIX,
      ),
      segmentKey: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        SEGMENT_KEY_PREFIX,
      ),
    }
  }

  async find(
    id: Deno.KvKeyPart,
    options?: FindOptions,
  ): Promise<Document<T1> | null> {
    // Create documetn id key
    const idKey = extendKey(this._keys.idKey, id)

    // Get large document entry
    const { value, versionstamp } = await this.kv.get<LargeDocumentEntry>(
      idKey,
      options,
    )

    // If no value, return null
    if (value === null || versionstamp === null) {
      return null
    }

    // Return constructed document
    return await this.constructLargeDocument(id, value, versionstamp)
  }

  async findMany(
    ids: Deno.KvKeyPart[],
    options?: FindManyOptions,
  ): Promise<Document<T1>[]> {
    // Map ids to document id keys
    const idKeys = ids.map((id) => extendKey(this._keys.idKey, id))

    // Get large document entries
    const entries = await kvGetMany<LargeDocumentEntry>(
      idKeys,
      this.kv,
      options,
    )

    // Initiate result list
    const result: Document<T1>[] = []

    // Get documents from large document entries
    await allFulfilled(
      entries.map(async ({ key, value, versionstamp }) => {
        // Get document id
        const id = getDocumentId(key)

        // If no id or value, continue to next entry
        if (
          typeof id === "undefined" || value === null || versionstamp === null
        ) {
          return
        }

        // Construct document and add to result list
        const doc = await this.constructLargeDocument(id, value, versionstamp)
        result.push(doc)
      }),
    )

    // Return found documents
    return result
  }

  async delete(...ids: KvId[]): Promise<void> {
    // Perform delete for each id
    await allFulfilled(ids.map(async (id) => {
      // Create document id key, get documetn value
      const idKey = extendKey(this._keys.idKey, id)
      const { value } = await this.kv.get<LargeDocumentEntry>(idKey)

      // If no value, abort delete
      if (!value) {
        return
      }

      // Delete document entry
      await this.kv.delete(idKey)

      // Delete document parts
      await useAtomics(this.kv, value.ids, (segId, atomic) => {
        const key = extendKey(this._keys.segmentKey, id, segId)
        return atomic.delete(key)
      })
    }))
  }

  /* PROTECTED METHODS */

  protected async handleMany(
    fn: (doc: Document<T1>) => unknown,
    options?: ListOptions<T1>,
  ): Promise<{ cursor: string | undefined }> {
    // Create list iterator with given options
    const selector = createListSelector(this._keys.idKey, options)
    const iter = this.kv.list<LargeDocumentEntry[]>(selector, options)

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
    await allFulfilled(docs.map((doc) => fn(doc)))

    // Return current iterator cursor
    return {
      cursor: iter.cursor || undefined,
    }
  }

  protected async setDocument(
    id: Deno.KvKeyPart,
    value: T1,
    options: SetOptions | undefined,
    overwrite = false,
  ): Promise<CommitResult<T1> | Deno.KvCommitError> {
    // Create document id key and parse document value
    const idKey = extendKey(this._keys.idKey, id)
    const parsed = parseDocumentValue(value, this.model)

    // Check if id already exists
    const check = await this.kv
      .atomic()
      .check({
        key: idKey,
        versionstamp: null,
      })
      .commit()

    // Check if document already exists
    if (!check.ok) {
      // If overwrite is false, return commit error
      if (!overwrite) {
        return {
          ok: false,
        }
      }

      // If overwrite is true, delete existing document entry
      await this.delete(id)
    }

    // Stringify data and initialize json parts list
    const json = JSON.stringify(parsed)
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
      const key = extendKey(this._keys.segmentKey, id, index)
      keys.push(key)
      index++

      return atomic
        .set(key, str, options)
    })

    // Determine whether setting json parts was successful
    const success = crs.length > 0 && crs.every((cr) => cr.ok)
    const retry = options?.retry ?? 0

    // If not successful, delete all json part entries
    if (!success) {
      await allFulfilled(keys.map((key) => this.kv.delete(key)))

      // Retry operation if there are remaining attempts
      if (retry > 0) {
        return await this.setDocument(id, parsed, {
          ...options,
          retry: retry - 1,
        }, overwrite)
      }

      // Return failed operation
      return {
        ok: false,
      }
    }

    // Create large document entry
    const entry: LargeDocumentEntry = {
      ids: keys.map((key) => getDocumentId(key)!).filter((id) =>
        typeof id !== "undefined"
      ),
    }

    // Set large document entry
    const cr = await this.kv
      .atomic()
      .set(idKey, entry, options)
      .commit()

    // If not successful, delete all json part entries
    if (!cr.ok) {
      await allFulfilled(keys.map((key) => this.kv.delete(key)))

      // Retry operation if there are remaining attempts
      if (retry > 0) {
        return await this.setDocument(id, parsed, {
          ...options,
          retry: retry - 1,
        }, overwrite)
      }

      // Return failed operation
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

  private async constructLargeDocument(
    id: KvId,
    value: LargeDocumentEntry,
    versionstamp: Document<T1>["versionstamp"],
  ): Promise<Document<T1>> {
    // Get document segment entries
    const { ids } = value
    const keys = ids.map((segId) => extendKey(this._keys.segmentKey, id, segId))
    const docEntries = await kvGetMany<string>(keys, this.kv)

    // Gather json parts and check validity
    const jsonParts = docEntries.reduce(
      (parts, entry) => entry.value ? [...parts, entry.value] : parts,
      [] as string[],
    )

    if (jsonParts.length !== docEntries.length) {
      throw new CorruptedDocumentDataError(
        `Corrupted document data - some JSON parts are missing
        JSON parts: ${jsonParts}
        `,
      )
    }

    const json = jsonParts.join("")

    try {
      // Create and return document
      return new Document<T1>({
        id,
        value: JSON.parse(json),
        versionstamp,
      }, this.model)
    } catch (_e) {
      // Throw if JSON.parse fails
      throw new CorruptedDocumentDataError(
        `Corrupted document data - failed to parse JSON
        JSON: ${json}
        `,
      )
    }
  }
}
