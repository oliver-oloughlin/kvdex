import type { Collection } from "./collection.ts"
import { ulid } from "./deps.ts"
import { InvalidCollectionError } from "./errors.ts"
import type {
  AtomicCheck,
  AtomicMutation,
  AtomicSetOptions,
  CollectionOptions,
  CollectionSelector,
  EnqueueOptions,
  HistoryEntry,
  KvId,
  KvObject,
  KvValue,
  Operations,
  ParseInputType,
  QueueValue,
  Schema,
  SchemaDefinition,
} from "./types.ts"
import {
  allFulfilled,
  deleteIndices,
  extendKey,
  keyEq,
  prepareEnqueue,
  setIndices,
} from "./utils.ts"

/**
 * Builder object for creating and executing atomic operations in the KV store.
 *
 * Handles a single collection context at a time,
 * with the option of selecting a new collection context during build.
 */
export class AtomicBuilder<
  const TSchema extends Schema<SchemaDefinition>,
  const TInput,
  const TOutput extends KvValue,
> {
  private kv: Deno.Kv
  private schema: TSchema
  private operations: Operations
  private collection: Collection<TInput, TOutput, CollectionOptions<TOutput>>

  /**
   * Create a new AtomicBuilder for building and executing atomic operations in the KV store.
   *
   * @param kv - The Deno KV instance to be used.
   * @param schema - The database schema containing all accessible collections.
   * @param collection - The collection currently in context for building atomic operations.
   * @param operations - List of prepared operations from previous instance.
   */
  constructor(
    kv: Deno.Kv,
    schema: TSchema,
    collection: Collection<TInput, TOutput, CollectionOptions<TOutput>>,
    operations?: Operations,
  ) {
    // Check for large collection
    if (collection._isSerialized) {
      throw new InvalidCollectionError(
        "Atomic operations are not supported for serialized collections",
      )
    }

    // Set kv, schema and collection context
    this.kv = kv
    this.schema = schema
    this.collection = collection

    // Initiate operations or set from given operations
    this.operations = operations ?? {
      atomic: kv.atomic(),
      prepareDeleteFns: [],
      indexDeleteCollectionKeys: [],
      indexAddCollectionKeys: [],
    }
  }

  /**
   * Select a new collection context.
   *
   * @example
   * ```ts
   * db
   *   .atomic(schema => schema.users)
   *   // ... some operations
   *   .select(schema => schema.numbers)
   * ```
   *
   * @param selector - Selector function for selecting a new collection from the database schema.
   * @returns A new AtomicBuilder instance.
   */
  select<const Input, const Output extends KvValue>(
    selector: CollectionSelector<TSchema, Input, Output>,
  ) {
    return new AtomicBuilder(
      this.kv,
      this.schema,
      selector(this.schema),
      this.operations,
    )
  }

  /**
   * Add a new document to the KV store with a randomely generated id.
   *
   * @example
   * ```ts
   * db
   *  .atomic(schema => schema.users)
   *  .add({
   *    username: "user1",
   *    age: 32
   *  })
   * ```
   *
   * @param data - Document data to be added.
   * @param options - Set options, optional.
   * @returns Current AtomicBuilder instance.
   */
  add(value: ParseInputType<TInput, TOutput>, options?: AtomicSetOptions) {
    return this.setDocument(null, value, options)
  }

  /**
   * Adds a new document to the KV store with the given id.
   *
   * @example
   * ```ts
   * db
   *  .atomic(schema => schema.users)
   *  .set("user1", {
   *    username: "user1",
   *    age: 32
   *  })
   * ```
   *
   * @param id - Id of the document.
   * @param value - Document value.
   * @param options - Set options, optional.
   * @returns Current AtomicBuilder instance.
   */
  set(
    id: KvId,
    value: ParseInputType<TInput, TOutput>,
    options?: AtomicSetOptions,
  ) {
    return this.setDocument(id, value, options)
  }

  /**
   * Deletes a document from the KV store with the given id.
   *
   * @example
   * ```ts
   * db
   *  .atomic(schema => schema.users)
   *  .delete("user1")
   * ```
   *
   * @param id - Id of document to be deleted.
   * @returns Current AtomicBuilder instance.
   */
  delete(id: KvId) {
    // Create id key from id and collection id key
    const collection = this.collection
    const idKey = extendKey(collection._keys.id, id)

    // Add delete operation
    this.operations.atomic.delete(idKey)

    // If collection is indexable, handle indexing
    if (this.collection._isIndexable) {
      // Add collection key for collision detection
      this.operations.indexDeleteCollectionKeys.push(collection._keys.base)

      // Add delete preperation function to prepeare delete functions list
      this.operations.prepareDeleteFns.push(async (kv) => {
        const doc = await kv.get<KvObject>(idKey)

        return {
          id,
          data: doc.value ?? {},
        }
      })
    }

    // Set history entry if keeps history
    if (this.collection._keepsHistory) {
      const historyKey = extendKey(this.collection._keys.history, id, ulid())

      const historyEntry: HistoryEntry<TOutput> = {
        type: "delete",
        timestamp: new Date(),
      }

      this.operations.atomic.set(historyKey, historyEntry)
    }

    // Return current AtomicBuilder
    return this
  }

  /**
   * Check if documents have been changed since a specific versionstamp.
   *
   * @example
   * ```ts
   * db
   *  .atomic(schema => schema.users)
   *  .check({
   *    id: "user1",
   *    versionstamp: null // Check that document does not already exist
   *  })
   * ```
   *
   * @param atomicChecks - AtomicCheck objects containing a document id and versionstamp.
   * @returns Current AtomicBuilder instance.
   */
  check(...atomicChecks: AtomicCheck<TOutput>[]) {
    // Create Deno atomic checks from atomci checks input list
    const checks: Deno.AtomicCheck[] = atomicChecks.map(
      ({ id, versionstamp }) => {
        const key = extendKey(this.collection._keys.id, id)
        return {
          key,
          versionstamp,
        }
      },
    )

    // Add chech operation
    this.operations.atomic.check(...checks)

    // Return current AtomicBuilder
    return this
  }

  /**
   * Adds the given value to the value of the document with the given id.
   * Sum only works for documents of type Deno.KvU64 and will throw an error for documents of any other type.
   *
   * @example
   * ```ts
   * db
   *  .atomic(schema => schema.u64s) // Select collection of Deno.KvU64 values
   *  .sum("num1", 100n)
   * ```
   *
   * @param id - Id of document that contains the value to be updated.
   * @param value - The value to add to the document value.
   * @returns Current AtomicBuilder instance.
   */
  sum(id: KvId, value: TOutput extends Deno.KvU64 ? bigint : never) {
    const idKey = extendKey(this.collection._keys.id, id)
    this.operations.atomic.sum(idKey, value)
    return this
  }

  /**
   * Sets the document value to the minimum of the existing and the given value.
   *
   * min only works for documents of type Deno.KvU64 and will throw an error for documents of any other type.
   *
   * @example
   * ```ts
   * db
   *  .atomic(schema => schema.u64s) // Select collection of Deno.KvU64 values
   *  .min("num1", 100n)
   * ```
   *
   * @param id - Id of document that contains the value to be updated.
   * @param value - The value to compare with the existing value.
   * @returns Current AtomicBuilder instance.
   */
  min(id: KvId, value: TOutput extends Deno.KvU64 ? bigint : never) {
    const idKey = extendKey(this.collection._keys.id, id)
    this.operations.atomic.min(idKey, value)
    return this
  }

  /**
   * Sets the document value to the maximum of the existing and the given value.
   *
   * max only works for documents of type Deno.KvU64 and will throw an error for documents of any other type.
   *
   * @example
   * ```ts
   * db
   *  .atomic(schema => schema.u64s) // Select collection of Deno.KvU64 values
   *  .max("num1", 100n)
   * ```
   *
   * @param id - Id of document that contains the value to be updated.
   * @param value - The value to compare with the existing value.
   * @returns Current AtomicBuilder instance.
   */
  max(id: KvId, value: TOutput extends Deno.KvU64 ? bigint : never) {
    const idKey = extendKey(this.collection._keys.id, id)
    this.operations.atomic.max(idKey, value)
    return this
  }

  /**
   * Specifies atomic mutations to be formed on documents.
   *
   * @example
   * ```ts
   * db
   *  .atomic(schema => schema.u64s)
   *  .mutate(
   *    {
   *      type: "delete",
   *      id: "num1"
   *    },
   *    {
   *      type: "set",
   *      id: "num2",
   *      value: new Deno.KvU64(200n)
   *    }
   *  )
   * ```
   *
   * @param mutations - Atomic mutations to be performed.
   * @returns Current AtomicBuilder instance.
   */
  mutate(...mutations: AtomicMutation<ParseInputType<TInput, TOutput>>[]) {
    // Add each atomic mutation by case
    mutations.forEach(({ id, ...rest }) => {
      switch (rest.type) {
        case "delete":
          this.delete(id)
          break
        case "set":
          this.set(id, rest.value, { expireIn: rest.expireIn })
          break
        case "add":
          this.add(rest.value, { expireIn: rest.expireIn })
          break
        case "max":
          this.max(id, rest.value as any)
          break
        case "min":
          this.min(id, rest.value as any)
          break
        case "sum":
          this.sum(id, rest.value as any)
          break
      }
    })

    // Return current AtomicBuilder
    return this
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
   * await db
   *   .atomic(schema => schema.users)
   *   .enqueue("soem data")
   *   .commit()
   *
   * // Delay of 2 seconds before delivery, sent to the "food" topic
   * await db
   *   .atomic(schema => schema.users)
   *   .enqueue("cake", {
   *     delay: 2_000,
   *     topic: "food"
   *   })
   *   .commit()
   * ```
   *
   * @param data - Data to be added to the collection queue.
   * @param options - Enqueue options, optional.
   * @returns - Promise resolving to Deno.KvCommitResult.
   */
  enqueue(data: QueueValue, options?: EnqueueOptions) {
    // Prepare and add enqueue operation
    const prep = prepareEnqueue(
      this.collection._keys.base,
      this.collection._keys.undelivered,
      data,
      options,
    )

    this.operations.atomic.enqueue(prep.msg, prep.options)

    // Return current AtomicBuilder
    return this
  }

  /**
   * Executes the built atomic operation.
   * Will always fail if trying to delete and add/set to the same indexable collection in the same operation.
   *
   * @returns A promise that resolves to a Deno.KvCommitResult if the operation is successful, or Deno.KvCommitError if not.
   */
  async commit(): Promise<Deno.KvCommitResult | Deno.KvCommitError> {
    // Check for key collisions between add/delete
    if (
      this.operations.indexAddCollectionKeys.some((addKey) =>
        this.operations.indexDeleteCollectionKeys.some((deleteKey) =>
          keyEq(addKey, deleteKey)
        )
      )
    ) {
      // Ff collisions are detected, return commit error
      return {
        ok: false,
      }
    }

    // Prepare delete ops
    const preparedIndexDeletes = await allFulfilled(
      this.operations.prepareDeleteFns.map((fn) => fn(this.kv)),
    )

    // Execute atomic operation
    const commitResult = await this.operations.atomic.commit()

    // If successful commit, perform delete ops
    if (commitResult.ok) {
      await allFulfilled(
        preparedIndexDeletes.map(async (preparedDelete) => {
          // Get document id and data from prepared delete object
          const {
            id,
            data,
          } = preparedDelete

          // Initiate atomic operation for index deletions
          const atomic = this.kv.atomic()

          // Set index delete operations using atomic operation
          deleteIndices(
            id,
            data,
            atomic,
            this.collection,
          )

          // Execute atomic operation
          await atomic.commit()
        }),
      )
    }

    // Return commit result
    return commitResult
  }

  /***********************/
  /*                     */
  /*   PRIVATE METHODS   */
  /*                     */
  /***********************/

  /**
   * Set a new document entry
   *
   * @param id
   * @param value
   * @param options
   * @returns
   */
  private setDocument(
    id: KvId | null,
    value: ParseInputType<TInput, TOutput>,
    options?: AtomicSetOptions,
  ) {
    // Create id key from collection id key and id
    const collection = this.collection
    const parsed = collection._model.parse(value as TInput)
    const docId = id ?? collection._idGenerator(parsed)
    const idKey = extendKey(collection._keys.id, docId)

    // Add set operation
    this.operations.atomic
      .check({ key: idKey, versionstamp: null })
      .set(idKey, parsed, options)

    if (collection._isIndexable) {
      // Add collection id key for collision detection
      this.operations.indexAddCollectionKeys.push(collection._keys.base)

      // Add indexing operations
      setIndices(
        docId,
        parsed as KvObject,
        parsed as KvObject,
        this.operations.atomic,
        this.collection,
        options,
      )
    }

    // Set history entry if keeps history
    if (this.collection._keepsHistory) {
      const historyKey = extendKey(this.collection._keys.history, docId, ulid())

      const historyEntry: HistoryEntry<TOutput> = {
        type: "write",
        timestamp: new Date(),
        value: parsed,
      }

      this.operations.atomic.set(historyKey, historyEntry)
    }

    // Return current AtomicBuilder
    return this
  }
}
