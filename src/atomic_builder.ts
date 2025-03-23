import type { Collection } from "./collection.ts";
import { ulid } from "@std/ulid";
import { InvalidCollectionError } from "./errors.ts";
import type {
  AtomicCheck,
  AtomicMutation,
  AtomicSetOptions,
  CollectionOptions,
  CollectionSelector,
  DenoAtomicCheck,
  DenoKv,
  DenoKvCommitError,
  DenoKvCommitResult,
  DenoKvU64,
  EmptyObject,
  EnqueueOptions,
  HistoryEntry,
  KvObject,
  KvValue,
  Operations,
  ParseId,
  Schema,
  SchemaDefinition,
} from "./types.ts";
import {
  allFulfilled,
  deleteIndices,
  extendKey,
  keyEq,
  prepareEnqueue,
  setIndices,
} from "./utils.ts";

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
  const TOptions extends CollectionOptions<TOutput>,
> {
  private kv: DenoKv;
  private schema: TSchema;
  private operations: Operations;
  private collection: Collection<
    TInput,
    TOutput,
    CollectionOptions<TOutput>
  >;

  /**
   * Create a new AtomicBuilder for building and executing atomic operations in the KV store.
   *
   * @param kv - The DenoKV instance to be used.
   * @param schema - The database schema containing all accessible collections.
   * @param collection - The collection currently in context for building atomic operations.
   * @param operations - List of prepared operations from previous instance.
   */
  constructor(
    kv: DenoKv,
    schema: TSchema,
    collection: Collection<
      TInput,
      TOutput,
      CollectionOptions<TOutput>
    >,
    operations?: Operations,
  ) {
    // Check for large collection
    if (collection["encoder"]) {
      throw new InvalidCollectionError(
        "Atomic operations are not supported for serialized collections",
      );
    }

    // Set kv, schema and collection context
    this.kv = kv;
    this.schema = schema;
    this.collection = collection;

    // Initiate operations or set from given operations
    this.operations = operations ?? {
      atomic: kv.atomic(),
      asyncMutations: [],
      prepareDeleteFns: [],
      indexDeleteCollectionKeys: [],
      indexAddCollectionKeys: [],
    };
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
  select<
    const Input,
    const Output extends KvValue,
    const Options extends CollectionOptions<Output>,
  >(
    selector: CollectionSelector<TSchema, Input, Output, Options>,
  ): AtomicBuilder<TSchema, Input, Output, Options> {
    return new AtomicBuilder(
      this.kv,
      this.schema,
      selector(this.schema),
      this.operations,
    );
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
  add(
    value: TInput,
    options?: AtomicSetOptions<TOptions>,
  ): this {
    return this.setDocument(null, value, options);
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
    id: ParseId<TOptions>,
    value: TInput,
    options?: AtomicSetOptions<TOptions>,
  ): this {
    return this.setDocument(id, value, options);
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
  delete(id: ParseId<TOptions>): this {
    // Create id key from id and collection id key
    const collection = this.collection;
    const idKey = extendKey(collection["keys"].id, id);

    // Add delete operation
    this.operations.atomic.delete(idKey);

    // If collection is indexable, handle indexing
    if (this.collection["isIndexable"]) {
      // Add collection key for collision detection
      this.operations.indexDeleteCollectionKeys.push(collection["keys"].base);

      // Add delete preperation function to prepeare delete functions list
      this.operations.prepareDeleteFns.push(async (kv) => {
        const doc = await kv.get(idKey);

        return {
          id,
          data: doc.value as KvObject ?? {},
        };
      });
    }

    // Set history entry if keeps history
    if (this.collection["keepsHistory"]) {
      const historyKey = extendKey(this.collection["keys"].history, id, ulid());

      const historyEntry: HistoryEntry<TOutput> = {
        type: "delete",
        timestamp: new Date(),
      };

      this.operations.atomic.set(historyKey, historyEntry);
    }

    // Return current AtomicBuilder
    return this;
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
  check(...atomicChecks: AtomicCheck<ParseId<TOptions>>[]): this {
    // Create Denoatomic checks from atomci checks input list
    const checks: DenoAtomicCheck[] = atomicChecks.map(
      ({ id, versionstamp }) => {
        const key = extendKey(this.collection["keys"].id, id);
        return {
          key,
          versionstamp,
        };
      },
    );

    // Add chech operation
    this.operations.atomic.check(...checks);

    // Return current AtomicBuilder
    return this;
  }

  /**
   * Adds the given value to the value of the document with the given id.
   * Sum only works for documents of type DenoKvU64 and will throw an error for documents of any other type.
   *
   * @example
   * ```ts
   * db
   *  .atomic(schema => schema.u64s) // Select collection of DenoKvU64 values
   *  .sum("num1", 100n)
   * ```
   *
   * @param id - Id of document that contains the value to be updated.
   * @param value - The value to add to the document value.
   * @returns Current AtomicBuilder instance.
   */
  sum(
    id: ParseId<TOptions>,
    value: TOutput extends DenoKvU64 ? bigint : never,
  ): this {
    const idKey = extendKey(this.collection["keys"].id, id);
    this.operations.atomic.sum(idKey, value);
    return this;
  }

  /**
   * Sets the document value to the minimum of the existing and the given value.
   *
   * min only works for documents of type DenoKvU64 and will throw an error for documents of any other type.
   *
   * @example
   * ```ts
   * db
   *  .atomic(schema => schema.u64s) // Select collection of DenoKvU64 values
   *  .min("num1", 100n)
   * ```
   *
   * @param id - Id of document that contains the value to be updated.
   * @param value - The value to compare with the existing value.
   * @returns Current AtomicBuilder instance.
   */
  min(
    id: ParseId<TOptions>,
    value: TOutput extends DenoKvU64 ? bigint : never,
  ): this {
    const idKey = extendKey(this.collection["keys"].id, id);
    this.operations.atomic.min(idKey, value);
    return this;
  }

  /**
   * Sets the document value to the maximum of the existing and the given value.
   *
   * max only works for documents of type DenoKvU64 and will throw an error for documents of any other type.
   *
   * @example
   * ```ts
   * db
   *  .atomic(schema => schema.u64s) // Select collection of DenoKvU64 values
   *  .max("num1", 100n)
   * ```
   *
   * @param id - Id of document that contains the value to be updated.
   * @param value - The value to compare with the existing value.
   * @returns Current AtomicBuilder instance.
   */
  max(
    id: ParseId<TOptions>,
    value: TOutput extends DenoKvU64 ? bigint : never,
  ): this {
    const idKey = extendKey(this.collection["keys"].id, id);
    this.operations.atomic.max(idKey, value);
    return this;
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
   *      value: new DenoKvU64(200n)
   *    }
   *  )
   * ```
   *
   * @param mutations - Atomic mutations to be performed.
   * @returns Current AtomicBuilder instance.
   */
  mutate(
    ...mutations: AtomicMutation<TInput, ParseId<TOptions>>[]
  ): this {
    // Add each atomic mutation by case
    mutations.forEach(({ id, ...rest }) => {
      switch (rest.type) {
        case "delete":
          this.delete(id);
          break;
        case "set":
          this.set(id, rest.value, { expireIn: rest.expireIn });
          break;
        case "add":
          this.add(rest.value, { expireIn: rest.expireIn });
          break;
        case "max":
          this.max(id, rest.value as any);
          break;
        case "min":
          this.min(id, rest.value as any);
          break;
        case "sum":
          this.sum(id, rest.value as any);
          break;
      }
    });

    // Return current AtomicBuilder
    return this;
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
   * @returns A promise resolving to DenoKvCommitResult.
   */
  enqueue(data: KvValue, options?: EnqueueOptions): this {
    // Prepare and add enqueue operation
    const prep = prepareEnqueue(
      this.collection["keys"].base,
      this.collection["keys"].undelivered,
      data,
      options,
    );

    this.operations.atomic.enqueue(prep.msg, prep.options);

    // Return current AtomicBuilder
    return this;
  }

  /**
   * Executes the built atomic operation.
   * Will always fail if trying to delete and add/set to the same indexable collection in the same operation.
   *
   * @returns A promise that resolves to a DenoKvCommitResult if the operation is successful, or DenoKvCommitError if not.
   */
  async commit(): Promise<DenoKvCommitResult | DenoKvCommitError> {
    // Perform async mutations
    for (const mut of this.operations.asyncMutations) {
      await mut();
    }

    // Check for key collisions between add/delete
    if (
      this.operations.indexAddCollectionKeys.some((addKey) =>
        this.operations.indexDeleteCollectionKeys.some((deleteKey) =>
          keyEq(addKey, deleteKey)
        )
      )
    ) {
      // If collisions are detected, return commit error
      return {
        ok: false,
      };
    }

    // Prepare delete ops
    const preparedIndexDeletes = await allFulfilled(
      this.operations.prepareDeleteFns.map((fn) => fn(this.kv)),
    );

    // Execute atomic operation
    const commitResult = await this.operations.atomic.commit();

    // If successful commit, perform delete ops
    if (commitResult.ok) {
      await allFulfilled(
        preparedIndexDeletes.map(async (preparedDelete) => {
          // Get document id and data from prepared delete object
          const {
            id,
            data,
          } = preparedDelete;

          // Initiate atomic operation for index deletions
          const atomic = this.kv.atomic();

          // Set index delete operations using atomic operation
          await deleteIndices(
            id,
            data,
            atomic,
            this.collection,
          );

          // Execute atomic operation
          await atomic.commit();
        }),
      );
    }

    // Return commit result
    return commitResult;
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
    id: ParseId<TOptions> | null,
    value: TInput,
    options?: AtomicSetOptions<TOptions>,
  ) {
    const overwrite = !!(options as AtomicSetOptions<EmptyObject> | undefined)
      ?.overwrite;

    if (this.collection["isIndexable"] && overwrite) {
      throw new InvalidCollectionError(
        "The overwrite property is not supported for indexable collections",
      );
    }

    this.operations.asyncMutations.push(async () => {
      // Create id key from collection id key and id
      const collection = this.collection;

      const parsed = collection["model"]._transform?.(value as TInput) ??
        collection["model"].parse(value);

      const docId = id ?? await collection["idGenerator"](parsed);
      const idKey = extendKey(collection["keys"].id, docId);

      // Add set operation
      this.operations.atomic.set(idKey, parsed, options);
      if (!overwrite) {
        this.operations.atomic.check({ key: idKey, versionstamp: null });
      }

      if (collection["isIndexable"]) {
        // Add collection id key for collision detection
        this.operations.indexAddCollectionKeys.push(collection["keys"].base);

        // Add indexing operations
        await setIndices(
          docId,
          parsed as KvObject,
          parsed as KvObject,
          this.operations.atomic,
          this.collection,
          options,
        );
      }

      // Set history entry if keeps history
      if (this.collection["keepsHistory"]) {
        const historyKey = extendKey(
          this.collection["keys"].history,
          docId,
          ulid(),
        );

        const historyEntry: HistoryEntry<TOutput> = {
          type: "write",
          timestamp: new Date(),
          value: parsed,
        };

        this.operations.atomic.set(historyKey, historyEntry);
      }
    });

    // Return current AtomicBuilder
    return this;
  }
}
