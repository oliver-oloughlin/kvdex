import { Collection } from "./collection.ts"
import {
  ID_KEY_PREFIX,
  KVDEX_KEY_PREFIX,
  SEGMENT_KEY_PREFIX,
  UINT8ARRAY_LENGTH_LIMIT,
} from "./constants.ts"
import type {
  CommitResult,
  Compression,
  FindManyOptions,
  FindOptions,
  KvId,
  KvKey,
  LargeCollectionKeys,
  LargeCollectionOptions,
  LargeDocumentEntry,
  LargeKvValue,
  ListOptions,
  Model,
  ParseInputType,
  QueueMessageHandler,
  QueueValue,
  SetOptions,
} from "./types.ts"
import {
  allFulfilled,
  compress,
  createListSelector,
  decompress,
  DENO_CORE,
  extendKey,
  getDocumentId,
  kvGetMany,
} from "./utils.ts"
import { Document } from "./document.ts"
import { AtomicWrapper } from "./atomic_wrapper.ts"

/**
 * Create a large collection builder function.
 *
 * @example
 * ```ts
 * collection(model<string>(), {
 *   idGenerator: () => ulid()
 * })
 * ```
 *
 * @param model - Model.
 * @param options - Large collection options.
 * @returns A large collection builder function.
 */
export function largeCollection<
  const TInput,
  const TOutput extends LargeKvValue,
>(
  model: Model<TInput, TOutput>,
  options?: LargeCollectionOptions<TOutput>,
) {
  return (
    kv: Deno.Kv,
    key: KvKey,
    queueHandlers: Map<string, QueueMessageHandler<QueueValue>[]>,
    idempotentListener: () => Promise<void>,
  ) =>
    new LargeCollection<
      TInput,
      TOutput,
      LargeCollectionOptions<TOutput>
    >(
      kv,
      key,
      model,
      queueHandlers,
      idempotentListener,
      options,
    )
}

export class LargeCollection<
  const TInput,
  const TOutput extends LargeKvValue,
  const TOptions extends LargeCollectionOptions<TOutput>,
> extends Collection<TInput, TOutput, TOptions> {
  readonly _keys: LargeCollectionKeys
  private compression: Compression

  constructor(
    kv: Deno.Kv,
    key: KvKey,
    model: Model<TInput, TOutput>,
    queueHandlers: Map<string, QueueMessageHandler<QueueValue>[]>,
    idempotentListener: () => Promise<void>,
    options?: TOptions,
  ) {
    // Invoke super constructor
    super(kv, key, model, queueHandlers, idempotentListener, options)

    // Set compression
    this.compression = options?.compression ?? {
      compress,
      decompress,
    }

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
  ): Promise<Document<TOutput> | null> {
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
  ): Promise<Document<TOutput>[]> {
    // Map ids to document id keys
    const idKeys = ids.map((id) => extendKey(this._keys.idKey, id))

    // Get large document entries
    const entries = await kvGetMany<LargeDocumentEntry>(
      idKeys,
      this.kv,
      options,
    )

    // Initiate result list
    const result: Document<TOutput>[] = []

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

      // Create atomic operation and delete all documetn entries
      const atomic = new AtomicWrapper(this.kv)
      atomic.delete(idKey)

      const keys = value.ids.map((segId) =>
        extendKey(this._keys.segmentKey, id, segId)
      )

      keys.forEach((key) => atomic.delete(key))

      // Commit the operation
      await atomic.commit()
    }))
  }

  /* PROTECTED METHODS */

  protected async handleMany<const T>(
    prefixKey: KvKey,
    fn: (doc: Document<TOutput>) => T,
    options: ListOptions<TOutput> | undefined,
  ) {
    // Create list iterator with given options
    const selector = createListSelector(prefixKey, options)
    const iter = this.kv.list<LargeDocumentEntry[]>(selector, options)

    // Initiate lists
    const docs: Document<TOutput>[] = []
    const result: Awaited<T>[] = []
    const errors: unknown[] = []

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
      const filter = options?.filter
      if (!filter || filter(doc)) {
        docs.push(doc)
      }
    }

    // Execute callback function for each document
    await allFulfilled(docs.map(async (doc) => {
      try {
        const res = await fn(doc)
        result.push(res)
      } catch (e) {
        errors.push(e)
      }
    }))

    // Throw any caught errors
    if (errors.length > 0) {
      throw errors
    }

    // Return result and current iterator cursor
    return {
      result,
      cursor: iter.cursor || undefined,
    }
  }

  protected async setDocument(
    id: KvId | null,
    value: ParseInputType<TInput, TOutput>,
    options: SetOptions | undefined,
    overwrite = false,
  ): Promise<CommitResult<TOutput> | Deno.KvCommitError> {
    // Create document id key and parse document value
    const parsed = this._model.parse(value as TInput)
    const docId = id ?? this._idGenerator(parsed)
    const idKey = extendKey(this._keys.idKey, docId)

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
      await this.delete(docId)
    }

    // Serialize and decompress
    const serialized = DENO_CORE.serialize(parsed)
    const data = this.compression.compress(serialized)

    // Initialize index, keys list and atomic operation
    let index = 0
    const keys: KvKey[] = []
    const atomic = new AtomicWrapper(this.kv)

    // Set segmented entries
    for (let i = 0; i < data.length; i += UINT8ARRAY_LENGTH_LIMIT) {
      const part = data.subarray(i, i + UINT8ARRAY_LENGTH_LIMIT)
      const key = extendKey(this._keys.segmentKey, docId, index)
      keys.push(key)
      atomic.set(key, part, options)
      index++
    }

    // Commit atomic operation and set retry atempts
    const partsCr = await atomic.commit()
    const retry = options?.retry ?? 0

    // If not successful, delete all parts
    if (!partsCr.ok) {
      const op = new AtomicWrapper(this.kv)
      keys.forEach((key) => op.delete(key))
      await op.commit()

      // Retry operation if there are remaining attempts
      if (retry > 0) {
        return await this.setDocument(docId, value, {
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

    // If not successful, delete all part entries
    if (!cr.ok) {
      await allFulfilled(keys.map((key) => this.kv.delete(key)))

      // Retry operation if there are remaining attempts
      if (retry > 0) {
        return await this.setDocument(docId, value, {
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
      id: docId,
      versionstamp: cr.versionstamp,
    }
  }

  private async constructLargeDocument(
    id: KvId,
    value: LargeDocumentEntry,
    versionstamp: Document<TOutput>["versionstamp"],
  ): Promise<Document<TOutput>> {
    // Get document parts
    const { ids } = value
    const keys = ids.map((segId) => extendKey(this._keys.segmentKey, id, segId))
    const docEntries = await kvGetMany<Uint8Array>(keys, this.kv)

    // Gather parts
    const data = Uint8Array.from(
      docEntries.map((doc) => Array.from(doc.value!)).flat(),
    )

    // Decompress and deserialize
    const serialized = this.compression.decompress(data)
    const deserialized = DENO_CORE.deserialize<TOutput>(serialized)

    // Return parsed document
    return new Document<TOutput>(this._model, {
      id,
      value: deserialized,
      versionstamp,
    })
  }
}
