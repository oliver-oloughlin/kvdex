import type {
  BuilderFn,
  CheckKeyOf,
  CollectionKeys,
  CollectionOptions,
  CommitResult,
  DenoKv,
  DenoKvCommitError,
  DenoKvCommitResult,
  DenoKvEntryMaybe,
  DenoKvStrictKey,
  EncodedEntry,
  Encoder,
  EnqueueOptions,
  FindManyOptions,
  FindOptions,
  FindUndeliveredOptions,
  HandleOneOptions,
  HistoryEntry,
  IdempotentListener,
  IdGenerator,
  IdUpsert,
  IndexDataEntry,
  KvId,
  KvKey,
  KvObject,
  KvValue,
  ListOptions,
  ManyCommitResult,
  Model,
  Pagination,
  PaginationResult,
  ParseId,
  PossibleCollectionOptions,
  PrimaryIndexKeys,
  PrimaryIndexUpsert,
  QueueHandlers,
  QueueListenerOptions,
  QueueMessageHandler,
  SecondaryIndexKeys,
  SetOptions,
  UpdateData,
  UpdateManyOptions,
  UpdateOneOptions,
  UpdateOptions,
  UpdateStrategy,
  WatchManager,
  WatchOptions,
} from "./types.ts";
import {
  allFulfilled,
  checkIndices,
  createHandlerId,
  createListOptions,
  createListSelector,
  createSecondaryIndexKeyPrefix,
  createWatcher,
  decodeData,
  deleteIndices,
  encodeData,
  extendKey,
  generateId,
  getDocumentId,
  isKvObject,
  kvGetMany,
  prepareEnqueue,
  selectsAll,
  setIndices,
  transform,
  validate,
} from "./utils.ts";
import {
  DEFAULT_UPDATE_STRATEGY,
  HISTORY_KEY_PREFIX,
  ID_KEY_PREFIX,
  KVDEX_KEY_PREFIX,
  PRIMARY_INDEX_KEY_PREFIX,
  SECONDARY_INDEX_KEY_PREFIX,
  SEGMENT_KEY_PREFIX,
  UINT8ARRAY_LENGTH_LIMIT,
  UNDELIVERED_KEY_PREFIX,
} from "./constants.ts";
import { AtomicWrapper } from "./atomic_wrapper.ts";
import { AtomicPool } from "./atomic_pool.ts";
import { Document } from "./document.ts";
import { model as m } from "./model.ts";
import { deepMerge } from "@std/collections/deep-merge";
import { concat } from "@std/bytes/concat";
import { ulid } from "@std/ulid";

/**
 * Create a new collection within a database context.
 *
 * @example
 * ```ts
 * import { model, collection, kvdex } from "@olli/kvdex"
 * import { jsonEncoder } from "@olli/kvdex/encoding/json"
 *
 * type User = {
 *   username: string
 *   age: number
 * }
 *
 * const kv = await Deno.openKv()
 *
 * const db = kvdex({
 *   kv: kv,
 *   schema: {
 *     numbers: collection(model<number>()),
 *     users: collection(model<User>(), {
 *       idGenerator: () => crypto.randomUUID(),
 *       encoder: jsonEncoder(),
 *       indices: {
 *         username: "primary",
 *         age: "secondary"
 *       }
 *     })
 *   }
 * })
 * ```
 *
 * @param model - Collection model.
 * @param options - Collection options.
 * @returns A collection builder function.
 */
export function collection<
  const TInput,
  const TOutput extends KvValue,
  const TOptions extends CollectionOptions<TOutput>,
>(
  model: Model<TInput, TOutput> = m(),
  options?: TOptions,
): BuilderFn<TInput, TOutput, TOptions> {
  return (
    kv: DenoKv,
    key: KvKey,
    queueHandlers: QueueHandlers,
    idempotentListener: IdempotentListener,
  ) =>
    new Collection<TInput, TOutput, TOptions>(
      kv,
      key,
      queueHandlers,
      idempotentListener,
      model,
      options,
    );
}

/** Represents a collection of documents and provides methods for handling them, alongside queues. */
export class Collection<
  const TInput,
  const TOutput extends KvValue,
  const TOptions extends CollectionOptions<TOutput>,
> {
  private kv: DenoKv;
  private queueHandlers: QueueHandlers;
  private idempotentListener: IdempotentListener;
  private model: Model<TInput, TOutput>;
  private primaryIndexList: string[];
  private secondaryIndexList: string[];
  private keys: CollectionKeys;
  private idGenerator: IdGenerator<TOutput, ParseId<TOptions>>;
  private encoder?: Encoder;
  private isIndexable: boolean;
  private keepsHistory: boolean;

  constructor(
    kv: DenoKv,
    key: KvKey,
    queueHandlers: QueueHandlers,
    idempotentListener: IdempotentListener,
    model: Model<TInput, TOutput>,
    options?: TOptions,
  ) {
    // Set basic fields
    this.kv = kv;
    this.queueHandlers = queueHandlers;
    this.idempotentListener = idempotentListener;
    this.model = model;
    this.idGenerator = options?.idGenerator ?? generateId as any;
    this.encoder = options?.encoder;

    // Set keys
    this.keys = {
      base: extendKey([KVDEX_KEY_PREFIX], ...key),
      id: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        ID_KEY_PREFIX,
      ),
      primaryIndex: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        PRIMARY_INDEX_KEY_PREFIX,
      ),
      secondaryIndex: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        SECONDARY_INDEX_KEY_PREFIX,
      ),
      segment: extendKey(
        [KVDEX_KEY_PREFIX],
        ...key,
        SEGMENT_KEY_PREFIX,
      ),
      undelivered: extendKey(
        [KVDEX_KEY_PREFIX],
        UNDELIVERED_KEY_PREFIX,
        ...key,
      ),
      history: extendKey(
        [KVDEX_KEY_PREFIX],
        HISTORY_KEY_PREFIX,
        ...key,
      ),
      historySegment: extendKey(
        [KVDEX_KEY_PREFIX],
        HISTORY_KEY_PREFIX,
        SEGMENT_KEY_PREFIX,
        ...key,
      ),
    };

    // Check all possible options
    const opts = (options ?? {}) as PossibleCollectionOptions;

    // Set index lists
    this.primaryIndexList = [];
    this.secondaryIndexList = [];

    Object.entries(opts?.indices ?? {}).forEach(([index, value]) => {
      if (value === "primary") {
        this.primaryIndexList.push(index);
      } else {
        this.secondaryIndexList.push(index);
      }
    });

    // Set isIndexable flag
    this.isIndexable = this.primaryIndexList.length > 0 ||
      this.secondaryIndexList.length > 0;

    // Set keepsHistory flag
    this.keepsHistory = options?.history ?? false;
  }

  /**********************/
  /*                    */
  /*   PUBLIC METHODS   */
  /*                    */
  /**********************/

  /**
   * Finds a document with the given id in the KV store.
   *
   * @example
   * ```ts
   * const userDoc1 = await db.users.find("user1")
   *
   * const userDoc2 = await db.users.find("user2", {
   *   consistency: "eventual" // "strong" by default
   * })
   * ```
   *
   * @param id - Id of the document to find.
   * @param options - Find options, optional.
   * @returns A promise that resolves to the found document, or null if not found.
   */
  async find(
    id: ParseId<TOptions>,
    options?: FindOptions,
  ): Promise<Document<TOutput, ParseId<TOptions>> | null> {
    // Create document key, get document entry
    const key = extendKey(this.keys.id, id);
    const entry = await this.kv.get(key, options);
    return await this.constructDocument(entry);
  }

  /**
   * Find a document by a primary index.
   *
   * @example
   * ```ts
   * // Finds a user document with the username = "oliver"
   * const userDoc = await db.users.findByPrimaryIndex("username", "oliver")
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param options - Find options, optional.
   * @returns A promise resolving to the document found by selected index, or null if not found.
   */
  async findByPrimaryIndex<
    const K extends PrimaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    options?: FindOptions,
  ): Promise<Document<TOutput, ParseId<TOptions>> | null> {
    // Serialize and compress index value
    const encoded = await encodeData(value, this.encoder);

    // Create the index key
    const key = extendKey(
      this.keys.primaryIndex,
      index as KvId,
      encoded,
    );

    // Get index entry
    const entry = await this.kv.get(key, options);

    // Return constructed document
    return await this.constructDocument(entry);
  }

  /**
   * Find documents by a secondary index. Secondary indices are not
   * unique, and therefore the result is an array of documents.
   * The method takes an optional options argument that can be used for filtering of documents, and pagination.
   *
   * @example
   * ```ts
   * // Returns all users with age = 24
   * const { result } = await db.users.findBySecondaryIndex("age", 24)
   *
   * // Returns all users with age = 24 AND username that starts with "o"
   * const { result } = await db.users.findBySecondaryIndex("age", 24, {
   *   filter: (doc) => doc.value.username.startsWith("o")
   * })
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param options - List options, optional.
   * @returns A promise resolving to an object containing the result list and iterator cursor.
   */
  async findBySecondaryIndex<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    options?: ListOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<PaginationResult<Document<TOutput, ParseId<TOptions>>>> {
    // Serialize and compress index value
    const encoded = await encodeData(value, this.encoder);

    // Create prefix key
    const prefixKey = extendKey(
      this.keys.secondaryIndex,
      index as KvId,
      encoded,
    );

    // Add documents to result list by secondary index
    return await this.handleMany(
      prefixKey,
      (doc) => doc,
      options,
    );
  }

  /**
   * Finds multiple documents with the given array of ids in the KV store.
   *
   * @example
   * ```ts
   * const users = await db.users.findMany(["user1", "user2", "user3"])
   * ```
   *
   * @example
   * ```ts
   * const users = await db.users.findMany(["user1", "user2", "user3"], {
   *   consistency: "eventual" // "strong" by default
   * })
   * ```
   *
   * @param ids - Array of ids of the documents to be found.
   * @param options - Find many options, optional.
   * @returns A promise that resolves to an array of documents.
   */
  async findMany(
    ids: ParseId<TOptions>[],
    options?: FindManyOptions,
  ): Promise<Document<TOutput, ParseId<TOptions>>[]> {
    // Create document keys, get document entries
    const keys = ids.map((id) => extendKey(this.keys.id, id));
    const entries = await kvGetMany(keys, this.kv, options);

    // Create empty result list
    const result: Document<TOutput, ParseId<TOptions>>[] = [];

    // Loop over entries, add to result list
    for (const entry of entries) {
      const doc = await this.constructDocument(entry);

      if (!doc) {
        continue;
      }

      result.push(doc);
    }

    // Return result list
    return result;
  }

  /**
   * Retrieve the version history of a document by id.
   *
   * A history entry contains a timestamp, type of either "write" or "delete",
   * and a copy of the document value if the type is "write".
   *
   * @example
   * ```ts
   * const { result } = await db.users.findHistory("user_id")
   * ```
   *
   * @example
   * ```ts
   * const { result } = await db.users.findHistory("user_id", {
   *   filter: (entry) => entry.type === "write",
   * })
   * ```
   *
   * @param id - Document id.
   * @returns A promise resolving to a list of history entries.
   */
  async findHistory(
    id: ParseId<TOptions>,
    options?: ListOptions<HistoryEntry<TOutput>, ParseId<TOptions>>,
  ): Promise<PaginationResult<HistoryEntry<TOutput>>> {
    // Initialize result list and create history key prefix
    const result: HistoryEntry<TOutput>[] = [];
    const keyPrefix = extendKey(this.keys.history, id);
    const selector = createListSelector(keyPrefix, options);

    // Create hsitory entries iterator
    const listOptions = createListOptions(options);
    const iter = await this.kv.list(selector, listOptions);

    // Collect history entries
    let count = 0;
    const offset = options?.offset ?? 0;
    for await (const { value, key } of iter) {
      // Skip by offset
      count++;

      if (count <= offset) {
        continue;
      }

      // Cast history entry
      let historyEntry = value as HistoryEntry<TOutput>;

      // Handle serialized entries
      if (historyEntry.type === "write" && this.encoder) {
        const { ids } = historyEntry.value as EncodedEntry;
        const timeId = getDocumentId(key as DenoKvStrictKey)!;

        const keys = ids.map((segmentId) =>
          extendKey(this.keys.historySegment, id, timeId, segmentId)
        );

        const entries = await kvGetMany(keys, this.kv);

        // Concatenate chunks
        const data = concat(entries.map((entry) => entry.value as Uint8Array));

        // Decompress and deserialize
        const decoded = await decodeData(data, this.encoder);

        // Set history entry
        historyEntry = {
          ...historyEntry,
          value: await validate(this.model, decoded),
        };
      } else if (historyEntry.type === "write") {
        // Set history entry
        historyEntry = {
          ...historyEntry,
          value: await validate(this.model, historyEntry.value),
        };
      }

      // Filter and add history entry to result list
      const filter = options?.filter;
      if (!filter || filter(historyEntry)) {
        result.push(historyEntry);
      }
    }

    // Return result list and iterator cursor
    return {
      result,
      cursor: iter.cursor || undefined,
    };
  }

  /**
   * Adds a new document to the KV store with a generated id.
   *
   * @example
   * ```ts
   * const result = await db.users.add({
   *   username: "oli",
   *   age: 24
   * })
   * ```
   *
   * @param data - Document value.
   * @param options - Set options, optional.
   * @returns Promise resolving to a CommitResult or CommitError.
   */
  async add(
    value: TInput,
    options?: SetOptions,
  ): Promise<CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError> {
    // Set document value with generated id
    return await this.setDocument(null, value, options);
  }

  /**
   * Adds a new document with the given id to the KV store.
   *
   * Does not overwrite existing documents with coliiding id.
   *
   * @example
   * ```ts
   * const result = await db.users.set("oliver", {
   *   username: "oli",
   *   age: 24
   * })
   * ```
   *
   * @param id - Document id.
   * @param data - Document value.
   * @param options - Set options, optional.
   * @returns Promise resolving to a CommitResult or CommitError.
   */
  async set(
    id: ParseId<TOptions>,
    data: TInput,
    options?: SetOptions,
  ): Promise<CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError> {
    return await this.setDocument(id, data, options);
  }

  /**
   * Deletes one or more documents with the given ids from the KV store.
   *
   * @example
   * ```ts
   * await db.users.delete("oliver")
   *
   * await db.users.delete("user1", "user2", "user3")
   * ```
   * @param ids - IDs of documents to be deleted.
   * @returns A promise that resovles to void.
   */
  async delete(...ids: ParseId<TOptions>[]): Promise<void> {
    await this.deleteDocuments(ids, this.keepsHistory);
  }

  /**
   * Delete a document by a primary index.
   *
   * @example
   * ```ts
   * // Deletes user with username = "oliver"
   * await db.users.deleteByPrimaryIndex("username", "oliver")
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param options - Find options, optional.
   * @returns A promise that resolves to void.
   */
  async deleteByPrimaryIndex<
    const K extends PrimaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    options?: FindOptions,
  ): Promise<void> {
    // Serialize and compress index value
    const encoded = await encodeData(value, this.encoder);

    // Create index key
    const key = extendKey(
      this.keys.primaryIndex,
      index as KvId,
      encoded,
    );

    // Get index entry
    const result = await this.kv.get(key, options);

    // If no value, abort delete
    if (result.value === null || result.versionstamp === null) {
      return;
    }

    // Extract document id from index entry
    const { __id__ } = result.value as
      & unknown
      & Pick<IndexDataEntry<KvObject>, "__id__">;

    // Delete document by id
    await this.deleteDocuments([__id__], this.keepsHistory);
  }

  /**
   * Delete documents by a secondary index. The method takes an optional options argument that can be used for filtering of documents, and pagination.
   *
   * @example
   * ```ts
   * // Deletes all users with age = 24
   * await db.users.deleteBySecondaryIndex("age", 24)
   *
   * // Deletes all users with age = 24 AND username that starts with "o"
   * await db.users.deleteBySecondaryIndex("age", 24, {
   *   filter: (doc) => doc.value.username.startsWith("o")
   * })
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param options - List options, optional.
   * @returns A promise that resolves to void.
   */
  async deleteBySecondaryIndex<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    options?: ListOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<Pagination> {
    // Serialize and compress index value
    const encoded = await encodeData(value, this.encoder);

    // Create prefix key
    const prefixKey = extendKey(
      this.keys.secondaryIndex,
      index as KvId,
      encoded,
    );

    // Delete documents by secondary index, return iterator cursor
    const { cursor } = await this.handleMany(
      prefixKey,
      (doc) => this.deleteDocuments([doc.id], this.keepsHistory),
      options,
    );

    // Return iterator cursor
    return { cursor };
  }

  /**
   * Updates a document with the given id in the KV store.
   *
   * By default, the `merge` strategy is used when available, falling back to
   * `replace` for primitive types and built-in objects (Date, RegExp, etc.).
   * For plain objects, the `merge-shallow` strategy is also supported.
   *
   * @example
   * ```ts
   * // Updates by replacing the existing value
   * const result = await db.numbers.update("num1", 10)
   * ```
   *
   * @example
   * ```ts
   * // Partial update using merge, only updates the age field
   * const result = await db.users.update(
   *   "oliver",
   *   { age: 30 },
   *   { strategy: "merge" }
   * )
   * ```
   *
   * @param id - Id of document to be updated
   * @param data - Updated data to be inserted into document
   * @param options - Set options, optional.
   * @returns
   */
  async update<const T extends UpdateOptions>(
    id: ParseId<TOptions>,
    data: UpdateData<TOutput, T["strategy"]>,
    options?: T,
  ): Promise<CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError> {
    // Get document
    const doc = await this.find(id);

    // If no document is found, return commit error
    if (!doc) {
      return {
        ok: false,
      };
    }

    // Update document and return commit result
    return await this.updateDocument(doc, data, options);
  }

  /**
   * Update a document by a primary index.
   *
   * @example
   * ```ts
   * // Updates a user with username = "oliver" to have age = 56
   * const result = await db.users.updateByPrimaryIndex("username", "oliver", { age: 56 })
   * ```
   *
   * @example
   * ```ts
   * // Updates a user document using shallow merge
   * const result = await db.users.updateByPrimaryIndex(
   *   "username",
   *   "anders",
   *   { age: 89 },
   *   { strategy: "merge-shallow" }
   * )
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param data - Update data to be inserted into document.
   * @param options - Set options, optional.
   * @returns Promise that resolves to a commit result.
   */
  async updateByPrimaryIndex<
    const K extends PrimaryIndexKeys<TOutput, TOptions>,
    const T extends UpdateOptions,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    data: UpdateData<TOutput, T["strategy"]>,
    options?: T,
  ): Promise<CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError> {
    // Find document by primary index
    const doc = await this.findByPrimaryIndex(index, value);

    // If no document, return commit error
    if (!doc) {
      return {
        ok: false,
      };
    }

    // Update document, return result
    return await this.updateDocument(doc, data, options);
  }

  /**
   * Update documents in the collection by a secondary index.
   *
   * @example
   * ```ts
   * // Updates all user documents with age = 24 and sets age = 67
   * const { result } = await db.users.updateBySecondaryIndex("age", 24, { age: 67 })
   * ```
   *
   * @example
   * ```ts
   * // Updates all users where age = 24 and username starts with "o", using shallow merge
   * const { result } = await db.users.updateBySecondaryIndex(
   *   "age",
   *   24,
   *   { age: 67 },
   *   {
   *     filter: (doc) => doc.value.username.startsWith("o"),
   *     strategy: "merge-shallow",
   *   }
   * )
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param data - Update data to be inserted into document.
   * @param options - Update many options, optional.
   * @returns Promise that resolves to an object containing result list and iterator cursor.
   */
  async updateBySecondaryIndex<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
    const T extends UpdateManyOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    data: UpdateData<TOutput, T["strategy"]>,
    options?: T,
  ): Promise<
    PaginationResult<
      CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError
    >
  > {
    // Serialize and compress index value
    const encoded = await encodeData(value, this.encoder);

    // Create prefix key
    const prefixKey = extendKey(
      this.keys.secondaryIndex,
      index as KvId,
      encoded,
    );

    // Update each document by secondary index, add commit result to result list
    return await this.handleMany(
      prefixKey,
      (doc) => this.updateDocument(doc, data, options),
      options,
    );
  }

  /**
   * Update an existing document by id, or set a new document entry if no matching document exists.
   *
   * @example
   * ```ts
   * const result = await db.users.upsert({
   *   id: "user_id",
   *   update: { username: "Chris" },
   *   set: {
   *     username: "Chris",
   *     age: 54,
   *     activities: ["bowling"],
   *     address: {
   *       country: "USA",
   *       city: "Las Vegas"
   *       street: "St. Boulevard"
   *       houseNumber: 23
   *     }
   *   }
   * })
   * ```
   *
   * @param input - Upsert by id input.
   * @param options - Upsert options.
   * @returns A promise resolving to either CommitResult or CommitError.
   */
  async upsert<
    const TUpsertOptions extends UpdateOptions,
  >(
    input: IdUpsert<
      TInput,
      TOutput,
      TUpsertOptions["strategy"],
      ParseId<TOptions>
    >,
    options?: TUpsertOptions,
  ): Promise<CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError> {
    const updateCr = await this.update(input.id, input.update, options);

    if (updateCr.ok) {
      return updateCr;
    }

    // Set new entry with given id
    return await this.set(input.id, input.set, {
      ...options,
      overwrite: false,
    });
  }

  /**
   * Update an existing document by a primary index, or set a new entry if no matching document exists.
   *
   * An id can be optionally specified which will be used when creating a new document entry.
   *
   * @example
   * ```ts
   * const result = await db.users.upsertByPrimaryIndex({
   *   index: ["username", "Jack"],
   *   update: { username: "Chris" },
   *   set: {
   *     username: "Chris",
   *     age: 54,
   *     activities: ["bowling"],
   *     address: {
   *       country: "USA",
   *       city: "Las Vegas"
   *       street: "St. Boulevard"
   *       houseNumber: 23
   *     }
   *   }
   * })
   * ```
   *
   * @param input - Upsert by primary index input.
   * @param options - Upsert options.
   * @returns A promise resolving to either CommitResult or CommitError.
   */
  async upsertByPrimaryIndex<
    const TIndex extends PrimaryIndexKeys<TOutput, TOptions>,
    const TUpsertOptions extends UpdateOptions,
  >(
    input: PrimaryIndexUpsert<
      TInput,
      TOutput,
      TIndex,
      TUpsertOptions["strategy"],
      ParseId<TOptions>
    >,
    options?: TUpsertOptions,
  ): Promise<CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError> {
    // First attempt update
    const updateCr = await this.updateByPrimaryIndex(
      ...input.index,
      input.update,
      options,
    );

    if (updateCr.ok) {
      return updateCr;
    }

    // If id is present, set new entry with given id
    if (input.id) {
      return await this.set(input.id, input.set, {
        ...options,
        overwrite: false,
      });
    }

    // If no id, add new entry with generated id
    return await this.add(input.set, {
      ...options,
      overwrite: false,
    });
  }

  /**
   * Update the value of multiple existing documents in the collection.
   *
   * @example
   * ```ts
   * // Updates all user documents and sets age = 67
   * await db.users.updateMany({ age: 67 })
   * ```
   *
   * @example
   * ```ts
   * // Updates all users where age > 20, using shallow merge
   * await db.users.updateMany({ age: 67 }, {
   *   filter: (doc) => doc.value.age > 20,
   *   strategy: "merge-shallow"
   * })
   * ```
   *
   * @example
   * ```ts
   * // Only updates first user document and fails the rest when username is a primary index
   * const { result } = await db.users.updateMany({ username: "oliver" })
   * ```
   *
   * @param value - Updated value to be inserted into documents.
   * @param options - Update many options, optional.
   * @returns Promise resolving to an object containing iterator cursor and result list.
   */
  async updateMany<
    const T extends UpdateManyOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  >(
    value: UpdateData<TOutput, T["strategy"]>,
    options?: T,
  ): Promise<
    PaginationResult<
      CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError
    >
  > {
    // Update each document, add commit result to result list
    return await this.handleMany(
      this.keys.id,
      (doc) => this.updateDocument(doc, value, options),
      options,
    );
  }

  /**
   * Update the value of multiple existing documents in the collection by a secondary order.
   *
   * @example
   * ```ts
   * // Updates the first 10 users ordered by age and sets username = "anon"
   * await db.users.updateManyBySecondaryOrder("age", { username: "anon" })
   * ```
   *
   * @param order - Secondary order to update documents by.
   * @param data - Updated data to be inserted into documents.
   * @param options - Update many options, optional.
   * @returns Promise resolving to an object containing iterator cursor and result list.
   */
  async updateManyBySecondaryOrder<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
    const T extends UpdateManyOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  >(
    order: K,
    data: UpdateData<TOutput, T["strategy"]>,
    options?: T,
  ): Promise<
    PaginationResult<
      CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError
    >
  > {
    // Create prefix key
    const prefixKey = extendKey(this.keys.secondaryIndex, order as KvId);

    // Update each document by secondary index, add commit result to result list
    return await this.handleMany(
      prefixKey,
      (doc) => this.updateDocument(doc, data, options),
      options,
    );
  }

  /**
   * Update the value of one existing document in the collection.
   *
   * @example
   * ```ts
   * // Updates the first user document and sets name = 67
   * const result = await db.users.updateOne({ age: 67 })
   * ```
   *
   * @example
   * ```ts
   * // Updates the first user where age > 20, using shallow merge
   * const result = await db.users.updateOne({ age: 67 }, {
   *   filter: (doc) => doc.value.age > 20,
   *   strategy: "merge-shallow"
   * })
   * ```
   *
   * @param data - Updated data to be inserted into documents.
   * @param options - Update many options, optional.
   * @returns Promise resolving to either a commit result or commit error object.
   */
  async updateOne<
    const T extends UpdateOneOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  >(
    data: UpdateData<TOutput, T["strategy"]>,
    options?: T,
  ): Promise<CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError> {
    // Update a single document
    const { result } = await this.handleMany(
      this.keys.id,
      (doc) => this.updateDocument(doc, data, options),
      { ...options, take: 1 },
    );

    // Return first result, or commit error object if not present
    return result.at(0) ?? {
      ok: false,
    };
  }

  /**
   * Update the value of one existing document in the collection by a secondary index.
   *
   * @example
   * ```ts
   * // Updates the first user with age = 20 and sets age = 67
   * const result = await db.users.updateOneBySecondaryIndex("age", 20, { age: 67 })
   * ```
   *
   * @example
   * ```ts
   * // Updates the first user where age = 20 and username starts with "a", using shallow merge
   * const result = await db.users.updateOne("age", 20, { age: 67 }, {
   *   filter: (doc) => doc.value.username.startsWith("a"),
   *   strategy: "merge-shallow"
   * })
   * ```
   *
   * @param index - Index.
   * @param value - Index value.
   * @param data - Updated data to be inserted into documents.
   * @param options - Update many options, optional.
   * @returns Promise resolving to either a commit result or commit error object.
   */
  async updateOneBySecondaryIndex<
    const T extends UpdateOneOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    data: UpdateData<TOutput, T["strategy"]>,
    options?: T,
  ): Promise<CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError> {
    // Create prefix key
    const prefixKey = await createSecondaryIndexKeyPrefix(
      index,
      value as KvValue,
      this,
    );

    // Update a single document
    const { result } = await this.handleMany(
      prefixKey,
      (doc) => this.updateDocument(doc, data, options),
      { ...options, take: 1 },
    );

    // Return first result, or commit error object if not present
    return result.at(0) ?? {
      ok: false,
    };
  }

  /**
   * Update the value of one existing document in the collection by a secondary order.
   *
   * @example
   * ```ts
   * // Updates the first user ordered by age and sets username = "anon"
   * const result = await db.users.updateOneBySecondaryOrder("age", { username: "anon" })
   * ```
   *
   * @param order - Secondary order to update document by.
   * @param data - Updated data to be inserted into document.
   * @param options - Update many options, optional.
   * @returns Promise resolving to either a commit result or commit error object.
   */
  async updateOneBySecondaryOrder<
    const T extends UpdateOneOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    order: K,
    data: UpdateData<TOutput, T["strategy"]>,
    options?: T,
  ): Promise<CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError> {
    // Create prefix key
    const prefixKey = extendKey(this.keys.secondaryIndex, order as KvId);

    // Update a single document
    const { result } = await this.handleMany(
      prefixKey,
      (doc) => this.updateDocument(doc, data, options),
      { ...options, take: 1 },
    );

    // Return first result, or commit error object if not present
    return result.at(0) ?? {
      ok: false,
    };
  }

  /**
   * Adds multiple documents to the KV store with generated ids.
   *
   * @example
   * ```ts
   * // Adds 5 new document entries to the KV store.
   * await results = await db.numbers.addMany([1, 2, 3, 4, 5])
   *
   * // Only adds the first entry, as "username" is defined as a primary index and cannot have duplicates
   * await results = await db.users.addMany([
   *   {
   *     username: "oli",
   *     age: 24
   *   },
   *   {
   *     username: "oli",
   *     age: 56
   *   }
   * ])
   * ```
   *
   * @param values - Document values to be added.
   * @param options - Set options, optional.
   * @returns A promise that resolves to a list of CommitResults or CommitErrors.
   */
  async addMany(
    values: TInput[],
    options?: SetOptions,
  ): Promise<ManyCommitResult | DenoKvCommitError> {
    // Initiate result and error lists
    const results:
      (CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError)[] = [];
    const errors: unknown[] = [];

    // Add each value
    await allFulfilled(
      values.map(async (value) => {
        try {
          const result = await this.add(value, options);
          results.push(result);
        } catch (e) {
          errors.push(e);
        }
      }),
    );

    // Throw any caught errors
    if (errors.length > 0) {
      throw errors;
    }

    // If a commit has failed, return commit error
    if (!results.every((cr) => cr.ok)) {
      return { ok: false };
    }

    // Return commit result
    return {
      ok: true,
    };
  }

  /**
   * Deletes multiple documents from the KV store according to the given options.
   *
   * If no options are given, all documents are deleted.
   *
   * @example
   * ```ts
   * // Delete all
   * await db.users.deleteMany()
   *
   * // Delete only users with username = "oli"
   * await db.users.deleteMany({
   *   filter: doc => doc.value.username === "oli"
   * })
   * ```
   *
   * @param options - List options, optional.
   * @returns A promise that resovles to an object containing the iterator cursor
   */
  async deleteMany(
    options?: ListOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<Pagination> {
    // Perform quick delete if all documents are to be deleted
    if (selectsAll(options)) {
      // Create list iterator and empty keys list, init atomic operation
      const iter = await this.kv.list({ prefix: this.keys.base }, options);

      const keys: DenoKvStrictKey[] = [];
      const atomic = new AtomicWrapper(this.kv);

      // Collect all collection entry keys
      for await (const { key } of iter) {
        keys.push(key as DenoKvStrictKey);
      }

      // Set history entries if keeps history
      if (this.keepsHistory) {
        const historyIter = await this.kv.list({ prefix: this.keys.id });
        for await (const { key } of historyIter) {
          const id = getDocumentId(key as DenoKvStrictKey);

          if (!id) {
            continue;
          }

          const historyKey = extendKey(this.keys.history, id, ulid());

          const historyEntry: HistoryEntry<TOutput> = {
            type: "delete",
            timestamp: new Date(),
          };

          atomic.set(historyKey, historyEntry);
        }
      }

      // Delete all keys and return
      keys.forEach((key) => atomic.delete(key));
      await atomic.commit();
    }

    // Execute delete operation for each document entry
    const { cursor } = await this.handleMany(
      this.keys.id,
      (doc) => this.deleteDocuments([doc.id], this.keepsHistory),
      options,
    );

    // Return iterator cursor
    return { cursor };
  }

  /**
   * Delete multiple documents from the KV store by a secondary order.
   *
   * The method takes an optional options argument that can be used for filtering of documents, and pagination.
   *
   * If no options are provided, all documents in the collection are deleted.
   *
   * @example
   * ```ts
   * // Deletes the first 10 users ordered by age
   * await db.users.deleteManyBySecondaryOrder("age", { limit: 10 })
   * ```
   *
   * @param order - Secondary order to delete documents by.
   * @param options - List options, optional.
   * @returns A promise that resolves to void.
   */
  async deleteManyBySecondaryOrder<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    order: K,
    options?: ListOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<Pagination> {
    // Create prefix key
    const prefixKey = extendKey(this.keys.secondaryIndex, order as KvId);

    // Delete documents by secondary index, return iterator cursor
    const { cursor } = await this.handleMany(
      prefixKey,
      (doc) => this.deleteDocuments([doc.id], this.keepsHistory),
      options,
    );

    // Return iterator cursor
    return { cursor };
  }

  /**
   * Retrieves multiple documents from the KV store according to the given options.
   *
   * If no options are given, all documents are retrieved.
   *
   * @example
   * ```ts
   * // Get all users
   * const { result } = await db.users.getMany()
   *
   * // Only get users with username that starts with "a"
   * const { result } = await db.users.getMany({
   *   filter: doc => doc.value.username.startsWith("a")
   * })
   * ```
   *
   * @param options - List options, optional.
   * @returns A promise that resovles to an object containing a list of the retrieved documents and the iterator cursor
   */
  async getMany(
    options?: ListOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<PaginationResult<Document<TOutput, ParseId<TOptions>>>> {
    // Get each document, return result list and current iterator cursor
    return await this.handleMany(
      this.keys.id,
      (doc) => doc,
      options,
    );
  }

  /**
   * Retrieves multiple documents from the KV store in the specified
   * secondary order and according to the given options.
   *
   * If no options are provided, all documents are retrieved.
   *
   * @example
   * ```ts
   * // Get all users ordered by age
   * const { result } = await db.users.getManyBySecondaryOrder("age")
   *
   * // Only get users with username that starts with "a", ordered by age
   * const { result } = await db.users.getManyBySecondaryOrder("age", {
   *   filter: doc => doc.value.username.startsWith("a")
   * })
   * ```
   *
   * @param order - Secondary order to retrieve documents by.
   * @param options - List options, optional.
   * @returns A promise that resovles to an object containing a list of the retrieved documents and the iterator cursor
   */
  async getManyBySecondaryOrder<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    order: K,
    options?: ListOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<PaginationResult<Document<TOutput, ParseId<TOptions>>>> {
    const prefixKey = extendKey(this.keys.secondaryIndex, order as KvId);
    return await this.handleMany(
      prefixKey,
      (doc) => doc,
      options,
    );
  }

  /**
   * Retrieves one document from the KV store according to the given options.
   *
   * If no options are given, the first document in the collection is retreived.
   *
   * @example
   * ```ts
   * // Get the first user
   * const user = await db.users.getOne()
   * ```
   *
   * @example
   * ```ts
   * // Get the first user with username that starts with "a"
   * const user = await db.users.getOne({
   *   filter: doc => doc.value.username.startsWith("a")
   * })
   * ```
   *
   * @param options - List options, optional.
   * @returns A promise that resovles to the retreived document
   */
  async getOne(
    options?: HandleOneOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<Document<TOutput, ParseId<TOptions>> | null> {
    // Get result list with one item
    const { result } = await this.handleMany(
      this.keys.id,
      (doc) => doc,
      { ...options, take: 1 },
    );

    // Return first result item, or null if not present
    return result.at(0) ?? null;
  }

  /**
   * Retrieves one document from the KV store by a secondary index and according to the given options.
   *
   * If no options are given, the first document in the collection by the given index is retrieved.
   *
   * @example
   * ```ts
   * // Get the first user with age = 69
   * const user = await db.users.getOneBySecondaryIndex("age", 69)
   * ```
   *
   * @example
   * ```ts
   * // Get the first user with age = 40 and username that starts with "a"
   * const user = await db.users.getOneBySecondaryIndex("age", 40, {
   *   filter: doc => doc.value.username.startsWith("a")
   * })
   * ```
   *
   * @param index - Index.
   * @param value - Index value.
   * @param options - List options, optional.
   * @returns A promise resolving to either a document or null.
   */
  async getOneBySecondaryIndex<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    options?: HandleOneOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<Document<TOutput, ParseId<TOptions>> | null> {
    // Create prefix key
    const prefixKey = await createSecondaryIndexKeyPrefix(
      index,
      value as KvValue,
      this,
    );

    // Get result list with one item
    const { result } = await this.handleMany(
      prefixKey,
      (doc) => doc,
      { ...options, take: 1 },
    );

    // Return first result item, or null if not present
    return result.at(0) ?? null;
  }

  /**
   * Retrieves one document from the KV store by a secondary order and according to the given options.
   *
   * If no options are provided, the first document in the collection by the given order is retrieved.
   *
   * @example
   * ```ts
   * // Get the first user ordered by age
   * const user = await db.users.getOneBySecondaryOrder("age")
   * ```
   *
   * @param order - Secondary order to retrieve document by.
   * @param options - List options, optional.
   * @returns A promise resolving to either a document or null.
   */
  async getOneBySecondaryOrder<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    order: K,
    options?: HandleOneOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<Document<TOutput, ParseId<TOptions>> | null> {
    // Create prefix key
    const prefixKey = extendKey(this.keys.secondaryIndex, order as KvId);

    // Get result list with one item
    const { result } = await this.handleMany(
      prefixKey,
      (doc) => doc,
      { ...options, take: 1 },
    );

    // Return first result item, or null if not present
    return result.at(0) ?? null;
  }

  /**
   * Executes a callback function for every document according to the given options.
   *
   * If no options are given, the callback function is executed for all documents in the collection.
   *
   * @example
   * ```ts
   * // Print all usernames
   * await db.users.forEach(doc => console.log(doc.value.username))
   *
   * // Print all usernames of users with age < 18
   * await db.users.forEach(doc => console.log(doc.value.username), {
   *   filter: doc => doc.value.age < 18
   * })
   * ```
   *
   * @param fn - Callback function.
   * @param options - List options, optional.
   * @returns A promise that resovles to an object containing the iterator cursor
   */
  async forEach(
    fn: (doc: Document<TOutput, ParseId<TOptions>>) => unknown,
    options?: ListOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<Pagination> {
    // Execute callback function for each document entry
    const { cursor } = await this.handleMany(
      this.keys.id,
      async (doc) => await fn(doc),
      options,
    );

    // Return iterator cursor
    return { cursor };
  }

  /**
   * Executes a callback function for every document by a secondary index and according to the given options.
   *
   * If no options are given, the callback function is executed for all documents matching the index.
   *
   * @example
   * ```ts
   * // Prints the username of all users where age = 20
   * await db.users.forEachBySecondaryIndex(
   *   "age",
   *   20,
   *   (doc) => console.log(doc.value.username),
   * )
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param fn - Callback function.
   * @param options - List options, optional.
   * @returns A promise that resovles to an object containing the iterator cursor.
   */
  async forEachBySecondaryIndex<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    fn: (doc: Document<TOutput, ParseId<TOptions>>) => unknown,
    options?: UpdateManyOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<Pagination> {
    // Create prefix key
    const prefixKey = await createSecondaryIndexKeyPrefix(
      index,
      value as KvValue,
      this,
    );

    // Execute callback function for each document entry
    const { cursor } = await this.handleMany(
      prefixKey,
      (doc) => fn(doc),
      options,
    );

    // Return iterator cursor
    return { cursor };
  }

  /**
   * Executes a callback function for every document by a secondary order and according to the given options.
   *
   * If no options are provided, the callback function is executed for all documents.
   *
   * @example
   * ```ts
   * // Prints the username of all users ordered by age
   * await db.users.forEachBySecondaryOrder(
   *   "age",
   *   (doc) => console.log(doc.value.username),
   * )
   * ```
   *
   * @param order - Secondary order to retrieve documents by.
   * @param fn - Callback function.
   * @param options - List options, optional.
   * @returns A promise that resovles to an object containing the iterator cursor.
   */
  async forEachBySecondaryOrder<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    order: K,
    fn: (doc: Document<TOutput, ParseId<TOptions>>) => unknown,
    options?: UpdateManyOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<Pagination> {
    // Create prefix key
    const prefixKey = extendKey(this.keys.secondaryIndex, order as KvId);

    // Execute callback function for each document entry
    const { cursor } = await this.handleMany(
      prefixKey,
      (doc) => fn(doc),
      options,
    );

    // Return iterator cursor
    return { cursor };
  }

  /**
   * Executes a callback function for every document according to the given options.
   *
   * If no options are given, the callback function is executed for all documents in the collection.
   *
   * The results from the callback function are returned as a list.
   *
   * @example
   * ```ts
   * // Maps from all user documents to a list of all user document ids
   * const { result } = await db.users.map(doc => doc.id)
   *
   * // Maps from users with age > 20 to a list of usernames
   * const { result } = await db.users.map(doc => doc.value.username, {
   *   filter: doc => doc.value.age > 20
   * })
   * ```
   *
   * @param fn - Callback function.
   * @param options - List options, optional.
   * @returns A promise that resovles to an object containing a list of the callback results and the iterator cursor
   */
  async map<const T>(
    fn: (doc: Document<TOutput, ParseId<TOptions>>) => T,
    options?: ListOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<PaginationResult<Awaited<T>>> {
    // Execute callback function for each document entry, return result and cursor
    return await this.handleMany(
      this.keys.id,
      (doc) => fn(doc),
      options,
    );
  }

  /**
   * Executes a callback function for every document by a secondary index and according to the given options.
   *
   * If no options are given, the callback function is executed for all documents matching the index.
   *
   * The results from the callback function are returned as a list.
   *
   * @example
   * ```ts
   * // Returns a list of usernames of all users where age = 20
   * const { result } = await db.users.mapBySecondaryIndex(
   *   "age",
   *   20,
   *   (doc) => doc.value.username,
   * )
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param fn - Callback function.
   * @param options - List options, optional.
   * @returns A promise that resovles to an object containing a list of the callback results and the iterator cursor.
   */
  async mapBySecondaryIndex<
    const T,
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    fn: (doc: Document<TOutput, ParseId<TOptions>>) => T,
    options?: UpdateManyOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<PaginationResult<Awaited<T>>> {
    // Serialize and compress index value
    const encoded = await encodeData(value, this.encoder);

    // Create prefix key
    const prefixKey = extendKey(
      this.keys.secondaryIndex,
      index as KvId,
      encoded,
    );

    // Execute callback function for each document entry, return result and cursor
    return await this.handleMany(
      prefixKey,
      (doc) => fn(doc),
      options,
    );
  }

  /**
   * Executes a callback function for every document by a secondary order and according to the given options.
   *
   * If no options are provided, the callback function is executed for all documents.
   *
   * The results from the callback function are returned as a list.
   *
   * @example
   * ```ts
   * // Returns a list of usernames of all users ordered by age
   * const { result } = await db.users.mapBySecondaryOrder(
   *   "age",
   *   (doc) => doc.value.username,
   * )
   * ```
   *
   * @param order - Secondary order to map documents by.
   * @param fn - Callback function.
   * @param options - List options, optional.
   * @returns A promise that resovles to an object containing a list of the callback results and the iterator cursor.
   */
  async mapBySecondaryOrder<
    const T,
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    order: K,
    fn: (doc: Document<TOutput, ParseId<TOptions>>) => T,
    options?: UpdateManyOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<PaginationResult<Awaited<T>>> {
    // Create prefix key
    const prefixKey = extendKey(this.keys.secondaryIndex, order as KvId);

    // Execute callback function for each document entry, return result and cursor
    return await this.handleMany(
      prefixKey,
      (doc) => fn(doc),
      options,
    );
  }

  /**
   * Counts the number of documents in the collection.
   *
   * @example
   * ```ts
   * // Returns the total number of user documents in the KV store
   * const count = await db.users.count()
   *
   * // Returns the number of users with age > 20
   * const count = await db.users.count({
   *   filter: doc => doc.value.age > 20
   * })
   * ```
   *
   * @param options - Count options, optional.
   * @returns A promise that resolves to a number representing the count.
   */
  async count(
    options?: ListOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<number> {
    // Initiate count result
    let result = 0;

    // Perform efficient count if counting all document entries
    if (selectsAll(options)) {
      const iter = await this.kv.list({ prefix: this.keys.id }, options);
      for await (const _ of iter) {
        result++;
      }
      return result;
    }

    // Perform count using many documents handler
    await this.handleMany(this.keys.id, () => result++, options);
    return result;
  }

  /**
   * Counts the number of documents in the collection by a secondary index.
   *
   * @example
   *
   * ```ts
   * // Counts all users where age = 20
   * const count = await db.users.countBySecondaryIndex("age", 20)
   * ```
   *
   * @param index - Selected index.
   * @param value - Index value.
   * @param options - Count options.
   * @returns A promise that resolves to a number representing the count.
   */
  async countBySecondaryIndex<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    index: K,
    value: CheckKeyOf<K, TOutput>,
    options?: ListOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<number> {
    // Serialize and compress index value
    const encoded = await encodeData(value, this.encoder);

    // Create prefix key
    const prefixKey = extendKey(
      this.keys.secondaryIndex,
      index as KvId,
      encoded,
    );

    // Initialize count result
    let result = 0;

    // Update each document by secondary index, add commit result to result list
    await this.handleMany(
      prefixKey,
      () => result++,
      options,
    );

    // Return count result
    return result;
  }

  /**
   * Counts the number of documents in the collection by a secondary order.
   *
   * @example
   *
   * ```ts
   * // Counts how many of the first 10 users ordered by age that are under the age of 18
   * const count = await db.users.countBySecondaryOrder("age", {
   *   limit: 10,
   *   filter: (doc) => doc.value.age < 18
   * })
   * ```
   *
   * @param order - Secondary order to count documents by.
   * @param options - Count options.
   * @returns A promise that resolves to a number representing the count.
   */
  async countBySecondaryOrder<
    const K extends SecondaryIndexKeys<TOutput, TOptions>,
  >(
    order: K,
    options?: ListOptions<
      Document<TOutput, ParseId<TOptions>>,
      ParseId<TOptions>
    >,
  ): Promise<number> {
    // Create prefix key
    const prefixKey = extendKey(this.keys.secondaryIndex, order as KvId);

    // Initialize count result
    let result = 0;

    // Update each document by secondary index, add commit result to result list
    await this.handleMany(
      prefixKey,
      () => result++,
      options,
    );

    // Return count result
    return result;
  }

  /**
   * Add data to the collection queue to be delivered to the queue listener
   * via ``db.collection.listenQueue()``. The data will only be received by queue
   * listeners on the specified collection and topic. The method takes an optional options
   * argument that can be used to set a delivery delay and topic.
   *
   * @example
   * ```ts
   * // Immediate delivery
   * await db.users.enqueue("some data")
   *
   * // Delay of 2 seconds before delivery, sent to the "food" topic
   * await db.users.enqueue("cake", {
   *   delay: 2_000,
   *   topic: "food"
   * })
   * ```
   *
   * @param data - Data to be added to the collection queue.
   * @param options - Enqueue options, optional.
   * @returns A promise resolving to DenoKvCommitResult.
   */
  async enqueue<T extends KvValue>(
    data: T,
    options?: EnqueueOptions,
  ): Promise<DenoKvCommitResult> {
    // Prepare message and options for enqueue
    const prep = prepareEnqueue(
      this.keys.base,
      this.keys.undelivered,
      data,
      options,
    );

    // Enqueue message with options
    return await this.kv.enqueue(prep.msg, prep.options);
  }

  /**
   * Listen for data from the collection queue that was enqueued with ``db.collection.enqueue()``.
   * Will only receive data that was enqueued to the specific collection queue.
   * Takes a handler function as argument.
   *
   * @example
   * ```ts
   * // Prints the data to console when recevied
   * db.users.listenQueue((data) => console.log(data))
   *
   * // Sends post request when data is received in the "posts" topic
   * db.users.listenQueue(async (data) => {
   *   const dataBody = JSON.stringify(data)
   *
   *   const res = await fetch("...", {
   *     method: "POST",
   *     body: dataBody
   *   })
   *
   *   console.log("POSTED:", dataBody, res.ok)
   * }, { topic: "posts" })
   * ```
   *
   * @param handler - Message handler function.
   * @param options - Queue listener options.
   * @returns void.
   */
  async listenQueue<T extends KvValue = KvValue>(
    handler: QueueMessageHandler<T>,
    options?: QueueListenerOptions,
  ): Promise<void> {
    // Create handler id
    const handlerId = createHandlerId(this.keys.base, options?.topic);

    // Add new handler to specified handlers
    const handlers = this.queueHandlers.get(handlerId) ?? [];
    handlers.push(handler as QueueMessageHandler<KvValue>);
    this.queueHandlers.set(handlerId, handlers);

    // Activate idempotent listener
    return await this.idempotentListener();
  }

  /**
   * Find an undelivered document entry by id from the collection queue.
   *
   * @example
   * ```ts
   * const doc1 = await db.users.findUndelivered("undelivered_id")
   *
   * const doc2 = await db.users.findUndelivered("undelivered_id", {
   *   consistency: "eventual", // "strong" by default
   * })
   * ```
   *
   * @param id - Document id.
   * @param options - Find options, optional.
   * @returns Document if found, null if not.
   */
  async findUndelivered<
    TId extends KvId,
    TOutput extends KvValue = KvValue,
  >(
    id: TId,
    options?: FindUndeliveredOptions<TOutput>,
  ): Promise<Document<TOutput, TId> | null> {
    // Create document key, get document entry
    const key = extendKey(this.keys.undelivered, id);
    const result = await this.kv.get(key, options);

    // If no entry exists, return null
    if (result.value === null || result.versionstamp === null) {
      return null;
    }

    const value = options?.model !== undefined
      ? await validate(options.model, result.value)
      : result.value as TOutput;

    // Return document
    return new Document<TOutput, TId>({
      id,
      versionstamp: result.versionstamp,
      value,
    });
  }

  /**
   * Delete the version history of a document by id.
   *
   * @example
   * ```ts
   * await db.users.deleteHistory("user_id")
   * ```
   *
   * @param id - Document id.
   */
  async deleteHistory(id: ParseId<TOptions>): Promise<void> {
    // Initialize atomic operation and create iterators
    const atomic = new AtomicWrapper(this.kv);
    const historyKeyPrefix = extendKey(this.keys.history, id);
    const historySegmentKeyPrefix = extendKey(this.keys.historySegment, id);
    const historyIter = await this.kv.list({ prefix: historyKeyPrefix });
    const historySegmentIter = await this.kv.list({
      prefix: historySegmentKeyPrefix,
    });

    // Delete history entries
    for await (const { key } of historyIter) {
      atomic.delete(key as DenoKvStrictKey);
    }

    // Delete any history segment entries
    for await (const { key } of historySegmentIter) {
      atomic.delete(key as DenoKvStrictKey);
    }

    // Commit atomic operation
    await atomic.commit();
  }

  /**
   * Delete an undelivered document entry by id from the collection queue.
   *
   * @example
   * ```ts
   * db.users.deleteUndelivered("id")
   * ```
   *
   * @param id - Id of undelivered document.
   */
  async deleteUndelivered(id: KvId): Promise<void> {
    const key = extendKey(this.keys.undelivered, id);
    await this.kv.delete(key);
  }

  /**
   * Listen for live changes to a single document by id.
   *
   * @example
   * ```ts
   * // Updates the document value every second
   * setInterval(() => db.numbers.set("id", Math.random()), 1_000)
   *
   * // Listen for any updates to the document value
   * db.numbers.watch("id", (doc) => {
   *   // Document will be null if the latest update was a delete operation
   *   console.log(doc?.value)
   * })
   * ```
   *
   * @example Cancel a watcher.
   * ```ts
   * const { promise, cancel } = db.numbers.watch("id", (doc) => {
   *   // ...
   * })
   *
   * await cancel()
   * await promise
   * ```
   *
   * @param id - Id of document to watch for.
   * @param fn - Callback function to be invoked on each update.
   * @param options - Watch options.
   */
  watch(
    id: ParseId<TOptions>,
    fn: (doc: Document<TOutput, ParseId<TOptions>> | null) => unknown,
    options?: WatchOptions,
  ): WatchManager {
    const key = extendKey(this.keys.id, id);

    return createWatcher(this.kv, options, [key], async (entries) => {
      const entry = entries.at(0);

      // If no entry is found, invoke callback function with null
      if (!entry) {
        await fn(null);
        return;
      }

      // Construct document and invoke callback function
      const doc = await this.constructDocument(entry);
      await fn(doc);
    });
  }

  /**
   * Listen for live changes to an array of specified documents by id.
   *
   * @example
   * ```ts
   * // Delayed setting of document values
   * setTimeout(() => db.numbers.set("id1", 10), 1_000)
   * setTimeout(() => db.numbers.set("id2", 20), 2_000)
   * setTimeout(() => db.numbers.set("id3", 30), 3_000)
   *
   * // Listen for any updates to the document values
   * db.numbers.watchMany(["id1", "id2", "id3"], (docs) => {
   *   // Prints for each update to any of the documents
   *   console.log(docs[0]?.value) // 10, 10, 10
   *   console.log(docs[1]?.value) // null, 20, 20
   *   console.log(docs[2]?.value) // null, null, 30
   * })
   * ```
   *
   * @example Cancel a watcher.
   * ```ts
   * const { promise, cancel } = db.numbers.watchMany(
   *   ["id1", "id2", "id3"],
   *   (docs) => {
   *     // ...
   *   },
   * )
   *
   * await cancel()
   * await promise
   * ```
   *
   * @param ids - List of ids of documents to watch.
   * @param fn - Callback function to be invoked on each update.
   * @param options - Watch options.
   */
  watchMany(
    ids: ParseId<TOptions>[],
    fn: (doc: (Document<TOutput, ParseId<TOptions>> | null)[]) => unknown,
    options?: WatchOptions,
  ): WatchManager {
    const keys = ids.map((id) => extendKey(this.keys.id, id));

    return createWatcher(this.kv, options, keys, async (entries) => {
      // Construct documents
      const docs = await Array.fromAsync(
        entries.map((entry) => this.constructDocument(entry)),
      );

      // Invoke callback function
      await fn(docs);
    });
  }

  /***********************/
  /*                     */
  /*   PRIVATE METHODS   */
  /*                     */
  /***********************/

  /**
   * Set a document entry in the KV store.
   *
   * @param id - Document id.
   * @param value - Document value.
   * @param options - Set options or undefined.
   * @param overwrite - Boolean flag determining whether to overwrite existing entry or fail operation.
   * @returns Promise resolving to a CommitResult object.
   */
  private async setDocument(
    id: ParseId<TOptions> | null,
    value: TInput,
    options: SetOptions | undefined,
  ): Promise<CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError> {
    // Create id, document key and parse document value
    const parsed = await transform(this.model, value) ??
      await validate(this.model, value);

    const docId = id ?? await this.idGenerator(parsed);
    const idKey = extendKey(this.keys.id, docId);
    return await this.setDoc(docId, idKey, parsed, options);
  }

  /**
   * Inner set document.
   *
   * @param docId
   * @param idKey
   * @param value
   * @param options
   * @param overwrite
   * @returns
   */
  private async setDoc(
    docId: ParseId<TOptions>,
    idKey: KvKey,
    value: TOutput,
    options: SetOptions | undefined,
  ): Promise<CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError> {
    // Initialize atomic operation and keys list
    const ids: KvId[] = [];
    let docValue: any = value;
    const isUint8Array = value instanceof Uint8Array;
    const timeId = ulid();
    const operationPool = new AtomicPool();
    const indexOperationPool = new AtomicPool();

    // Check for id collision
    if (!options?.overwrite) {
      operationPool.check({
        key: idKey,
        versionstamp: null,
      });
    }

    // Serialize if enabled
    if (this.encoder) {
      const encoded = isUint8Array
        ? await this.encoder.compressor?.compress(value) ?? value
        : await encodeData(value, this.encoder);

      // Set segmented entries
      let index = 0;
      for (let i = 0; i < encoded.length; i += UINT8ARRAY_LENGTH_LIMIT) {
        const part = encoded.subarray(i, i + UINT8ARRAY_LENGTH_LIMIT);
        const key = extendKey(this.keys.segment, docId, index);
        ids.push(index);

        operationPool.set(key, part, options);

        // Set history segments if keeps history
        if (this.keepsHistory) {
          const historySegmentKey = extendKey(
            this.keys.historySegment,
            docId,
            timeId,
            index,
          );

          operationPool.set(historySegmentKey, part);
        }

        index++;
      }

      // Set serialized document value
      const serializedEntry: EncodedEntry = {
        ids,
        isUint8Array,
      };

      docValue = serializedEntry;
    }

    // Set document entry
    operationPool.set(idKey, docValue, options);

    // Set history entry if keeps history
    if (this.keepsHistory) {
      const historyKey = extendKey(this.keys.history, docId, timeId);

      const historyEntry: HistoryEntry<any> = {
        type: "write",
        timestamp: new Date(),
        value: docValue,
      };

      operationPool.set(historyKey, historyEntry);
    }

    // Set indices if is indexable
    if (this.isIndexable) {
      await setIndices(
        docId,
        value as KvObject,
        docValue,
        indexOperationPool,
        this,
        options,
      );
    }

    // Initialize index check, commit result and atomic operation
    let indexCheck = false;
    let cr: DenoKvCommitResult | DenoKvCommitError = { ok: false };

    const atomic = options?.batched
      ? new AtomicWrapper(this.kv)
      : this.kv.atomic();

    // Perform index mutations first if operation is batched, else bind all mutations to main operation
    if (options?.batched) {
      const indexAtomic = this.kv.atomic();
      indexOperationPool.bindTo(indexAtomic);
      const indexCr = await indexAtomic.commit();
      indexCheck = indexCr.ok;
    } else {
      indexOperationPool.bindTo(atomic);
    }

    // Bind remaining mutations to main operation
    operationPool.bindTo(atomic);

    // Commit operation if not batched or if index setters completed successfully
    if (!options?.batched || indexCheck) {
      cr = await atomic.commit();
    }

    // Handle failed operation
    if (!cr.ok) {
      // Delete any entries upon failed batched operation
      if (options?.batched && indexCheck) {
        const failedAtomic = new AtomicWrapper(this.kv);

        if (this.keepsHistory) {
          const historyKey = extendKey(this.keys.history, docId, timeId);
          failedAtomic.delete(historyKey);
        }

        if (this.encoder) {
          const { ids } = docValue as EncodedEntry;
          ids.forEach((id) =>
            failedAtomic.delete(extendKey(this.keys.segment, docId, id))
          );
        }

        if (this.isIndexable) {
          await deleteIndices(
            docId,
            value as KvObject,
            failedAtomic,
            this,
          );
        }

        await failedAtomic.commit();
      }

      // Return commit error if no remaining retry attempts
      const retry = options?.retry ?? 0;
      if (!retry) {
        return {
          ok: false,
        };
      }

      // Retry operation and decrement retry count
      return await this.setDoc(docId, idKey, value, {
        ...options,
        retry: retry - 1,
      });
    }

    // Return commit result
    return {
      ...cr,
      id: docId,
    };
  }

  /**
   * Update a document entry with new data.
   *
   * @param doc
   * @param data
   * @param options
   * @returns
   */
  private async updateDocument(
    doc: Document<TOutput, ParseId<TOptions>>,
    data: UpdateData<TOutput, UpdateStrategy>,
    options: UpdateOptions | undefined,
  ): Promise<CommitResult<TOutput, ParseId<TOptions>> | DenoKvCommitError> {
    // Get document value, delete document entry
    const { value, id } = doc;

    // If indexable, check for index collisions and delete exisitng index entries
    if (this.isIndexable) {
      const atomic = this.kv.atomic();

      await checkIndices(
        data as KvObject,
        atomic,
        this,
      );

      await deleteIndices(
        id,
        doc.value as KvObject,
        atomic,
        this,
      );

      const cr = await atomic.commit();

      if (!cr.ok) {
        return {
          ok: false,
        };
      }
    }

    // If serialized, delete existing segment entries
    if (this.encoder) {
      const atomic = new AtomicWrapper(this.kv);
      const keyPrefix = extendKey(this.keys.segment, id);
      const iter = await this.kv.list({ prefix: keyPrefix });

      for await (const { key } of iter) {
        atomic.delete(key as DenoKvStrictKey);
      }

      await atomic.commit();
    }

    // Determine update strategy and check value type
    const strategy = options?.strategy ?? DEFAULT_UPDATE_STRATEGY;
    const isObject = isKvObject(value);

    // Handle different update strategies
    const updated = strategy === "replace"
      ? data as TOutput
      : isObject && strategy === "merge-shallow"
      ? {
        ...value as KvObject,
        ...data as KvObject,
      }
      : deepMerge({ value }, { value: data }, options?.mergeOptions).value;

    // Parse updated value
    const parsed = await validate(this.model, updated);

    // Set new document value
    return await this.setDoc(
      id,
      extendKey(this.keys.id, id),
      parsed,
      {
        ...options,
        overwrite: true,
      },
    );
  }

  /**
   * Construct a document from an entry.
   *
   * @param entry
   * @returns
   */
  private async constructDocument(
    { key, value, versionstamp }: DenoKvEntryMaybe,
  ) {
    if (!versionstamp) {
      return null;
    }

    const indexedDocId = (value as IndexDataEntry<any>)?.__id__;
    const docId = indexedDocId ??
      getDocumentId(key as DenoKvStrictKey);

    if (!docId) {
      return null;
    }

    if (this.encoder) {
      // Get document parts
      const { ids, isUint8Array } = value as EncodedEntry;

      const keys = ids.map((segId) =>
        extendKey(this.keys.segment, docId, segId)
      );

      const docEntries = await kvGetMany(keys, this.kv);

      // Concatenate chunks
      const data = concat(docEntries.map((entry) => entry.value as Uint8Array));

      // Decompress and deserialize
      const decoded = isUint8Array
        ? (await this.encoder?.compressor?.decompress(data) ?? data) as TOutput
        : await decodeData<TOutput>(data, this.encoder);

      const parsed = await validate(this.model, decoded);

      // Return parsed document
      return new Document<TOutput, ParseId<TOptions>>({
        id: docId as ParseId<TOptions>,
        value: parsed,
        versionstamp,
      });
    }

    // Remove id from value and return parsed document if indexed entry
    if (typeof indexedDocId !== "undefined") {
      const { __id__, ...val } = value as any;
      const parsed = await validate(this.model, val);

      return new Document<TOutput, ParseId<TOptions>>({
        id: docId as ParseId<TOptions>,
        value: parsed,
        versionstamp,
      });
    }

    const parsed = await validate(this.model, value);

    // Return parsed document
    return new Document<TOutput, ParseId<TOptions>>({
      id: docId as ParseId<TOptions>,
      value: parsed,
      versionstamp,
    });
  }

  /**
   * Perform operations on lists of documents in the collection.
   *
   * @param prefixKey - Prefix key for list selector.
   * @param fn - Callback function.
   * @param options - List options, optional.
   * @returns Promise that resolves to object with iterator cursor.
   */
  private async handleMany<const T>(
    prefixKey: KvKey,
    fn: (doc: Document<TOutput, ParseId<TOptions>>) => T,
    options:
      | ListOptions<Document<TOutput, ParseId<TOptions>>, ParseId<TOptions>>
      | undefined,
  ) {
    // Create list iterator with given options
    const selector = createListSelector(prefixKey, options);
    const listOptions = createListOptions(options);
    const iter = await this.kv.list(selector, listOptions);

    // Initiate lists
    const docs: Document<TOutput, ParseId<TOptions>>[] = [];
    const result: Awaited<T>[] = [];
    const errors: unknown[] = [];
    const take = options?.take;

    // Loop over each document entry
    let count = -1;
    const offset = options?.offset ?? 0;
    for await (const entry of iter) {
      // Increment count
      count++;

      // Skip by offset
      if (count < offset) {
        continue;
      }

      // Check if result limit is reached
      if (take && docs.length >= take) {
        break;
      }

      // Construct document from entry
      const doc = await this.constructDocument(entry);

      // Continue if document is not constructed
      if (!doc) {
        continue;
      }

      // Filter document and add to documents list
      const filter = options?.filter;
      if (!filter || filter(doc)) {
        docs.push(doc);
      }
    }

    // Execute callback function for each document
    await allFulfilled(docs.map(async (doc) => {
      try {
        result.push(await fn(doc));
      } catch (e) {
        errors.push(e);
      }
    }));

    // Throw any caught errors
    if (errors.length > 0) {
      throw errors;
    }

    // Return result and current iterator cursor
    return {
      result,
      cursor: iter.cursor || undefined,
    };
  }

  /**
   * Delete documents by id.
   *
   * @param ids - List of document ids.
   * @param recordHistory - Whether to record history entry or not.
   * @returns
   */
  private async deleteDocuments(ids: KvId[], recordHistory: boolean) {
    // Initialize atomic operation
    const atomic = new AtomicWrapper(this.kv);

    // Set delete history entry if recordHistory is true
    if (recordHistory) {
      ids.forEach((id) => {
        const historyKey = extendKey(this.keys.history, id, ulid());

        const historyEntry: HistoryEntry<TOutput> = {
          type: "delete",
          timestamp: new Date(),
        };

        atomic.set(historyKey, historyEntry);
      });
    }

    if (this.isIndexable && this.encoder) {
      // Run delete operations for each id
      await allFulfilled(ids.map(async (id) => {
        // Create document id key, get entry and construct document
        const idKey = extendKey(this.keys.id, id);
        const entry = await this.kv.get(idKey);
        const doc = await this.constructDocument(entry);

        // Delete document entries
        atomic.delete(idKey);

        if (entry.value) {
          const keys = (entry.value as EncodedEntry).ids.map((segId) =>
            extendKey(this.keys.segment, id, segId)
          );

          keys.forEach((key) => atomic.delete(key));
        }

        if (doc) {
          await deleteIndices(id, doc.value as KvObject, atomic, this);
        }
      }));

      // Commit the operation
      await atomic.commit();
      return;
    }

    if (this.isIndexable) {
      // Run delete operations for each id
      await allFulfilled(ids.map(async (id) => {
        // Create idKey, get document value
        const idKey = extendKey(this.keys.id, id);
        const { value } = await this.kv.get(idKey);

        // If no value, abort delete
        if (!value) {
          return;
        }

        // Delete document entries
        atomic.delete(idKey);
        await deleteIndices(id, value as KvObject, atomic, this);
      }));

      // Commit the operation
      await atomic.commit();
      return;
    }

    if (this.encoder) {
      // Perform delete for each id
      await allFulfilled(ids.map(async (id) => {
        // Create document id key, get document value
        const idKey = extendKey(this.keys.id, id);
        const { value } = await this.kv.get(idKey);

        // If no value, abort delete
        if (!value) {
          return;
        }

        // Delete document entries
        atomic.delete(idKey);

        const keys = (value as EncodedEntry).ids.map((segId) =>
          extendKey(this.keys.segment, id, segId)
        );

        keys.forEach((key) => atomic.delete(key));
      }));

      // Commit the operation
      await atomic.commit();
      return;
    }

    // Perform delete for each id and commit the operation
    ids.forEach((id) => atomic.delete(extendKey(this.keys.id, id)));
    await atomic.commit();
  }
}
