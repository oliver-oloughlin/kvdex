import type { Collection } from "./collection.ts"
import { IndexableCollection } from "./indexable_collection.ts"
import { LargeCollection } from "./large_collection.ts"
import type {
  AtomicCheck,
  AtomicMutation,
  AtomicSetOptions,
  CollectionOptions,
  CollectionSelector,
  IndexableCollectionOptions,
  KvId,
  KvValue,
  Model,
  Operations,
  Schema,
  SchemaDefinition,
} from "./types.ts"
import {
  allFulfilled,
  deleteIndices,
  extendKey,
  getDocumentId,
  keyEq,
  setIndices,
} from "./utils.internal.ts"

/**
 * Builder object for creating and executing atomic operations in the KV store.
 *
 * Handles a single collection context at a time,
 * with the option of selecting a new collection context during build.
 */
export class AtomicBuilder<
  const T1 extends Schema<SchemaDefinition>,
  const T2 extends KvValue,
> {
  private kv: Deno.Kv
  private schema: T1
  private operations: Operations
  private collection: Collection<T2, CollectionOptions<T2>>

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
    schema: T1,
    collection: Collection<T2, CollectionOptions<T2>>,
    operations?: Operations,
  ) {
    // Set kv and schema
    this.kv = kv
    this.schema = schema

    // Initiate operations or set from given operations
    this.operations = operations ?? {
      atomicFns: [],
      prepareDeleteFns: [],
      indexDeleteCollectionKeys: [],
      indexAddCollectionKeys: [],
    }

    // Set colection context
    this.collection = collection
  }

  /**
   * Select a new collection context.
   *
   * **Example:**
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
  select<const TValue extends KvValue>(
    selector: CollectionSelector<T1, TValue>,
  ) {
    return createAtomicBuilder(this.kv, this.schema, selector, this.operations)
  }

  /**
   * Add a new document to the KV store with a randomely generated id.
   *
   * **Example:**
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
  add(data: T2, options?: AtomicSetOptions) {
    // Generate id and perform set operation
    const id = this.collection._idGenerator(data)
    return this.set(id, data, options)
  }

  /**
   * Adds a new document to the KV store with the given id.
   *
   * **Example:**
   * ```ts
   * db
   *  .atomic(schema => schema.users)
   *  .set("user1", {
   *    username: "user1",
   *    age: 32
   *  })
   * ```
   *
   * @param id - Id of the document to be added.
   * @param data - Document data to be added.
   * @param options - Set options, optional.
   * @returns Current AtomicBuilder instance.
   */
  set(id: KvId, data: T2, options?: AtomicSetOptions) {
    // Create id key from collection id key and id
    const collectionKey = this.collection._keys.idKey
    const idKey = extendKey(collectionKey, id)

    // Add set operation to atomic ops list
    this.operations.atomicFns.push((op) =>
      op.check({ key: idKey, versionstamp: null }).set(idKey, data, options)
    )

    if (this.collection instanceof IndexableCollection) {
      // Set data as Model type
      const _data = data as Model

      // Add collection id key for collision detection
      this.operations.indexAddCollectionKeys.push(collectionKey)

      // Add indexing operations to atomic ops list
      this.operations.atomicFns.push((op) => {
        return setIndices(
          id,
          _data,
          op,
          this.collection as unknown as IndexableCollection<
            Model,
            IndexableCollectionOptions<Model>
          >,
          options,
        )
      })
    }

    // Return current atomic operation builder
    return this
  }

  /**
   * Deletes a document from the KV store with the given id.
   *
   * **Example:**
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
    const collectionIdKey = this.collection._keys.idKey
    const idKey = extendKey(collectionIdKey, id)

    // Add delete operation to atomic ops list
    this.operations.atomicFns.push((op) => op.delete(idKey))

    // If collection is indexable, handle indexing
    if (this.collection instanceof IndexableCollection) {
      // Add collection key for collision detection
      this.operations.indexDeleteCollectionKeys.push(collectionIdKey)

      // Add delete preperation function to prepeare delete functions list
      this.operations.prepareDeleteFns.push(async (kv) => {
        const doc = await kv.get<Model>(idKey)

        return {
          id,
          data: doc.value ?? {},
        }
      })
    }

    // Return current atomic operation builder
    return this
  }

  /**
   * Check if documents have been changed since a specific versionstamp.
   *
   * **Example:**
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
  check(...atomicChecks: AtomicCheck<T2>[]) {
    // Create Deno atomic checks from atomci checks input list
    const checks: Deno.AtomicCheck[] = atomicChecks.map(
      ({ id, versionstamp }) => {
        const key = extendKey(this.collection._keys.idKey, id)
        return {
          key,
          versionstamp,
        }
      },
    )

    // Add atomic chech operation to atomic ops list
    this.operations.atomicFns.push((op) => op.check(...checks))

    // Return current atomic opertaion builder
    return this
  }

  /**
   * Adds the given value to the value of the document with the given id.
   * Sum only works for documents of type Deno.KvU64 and will throw an error for documents of any other type.
   *
   * **Example:**
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
  sum(id: KvId, value: T2 extends Deno.KvU64 ? bigint : never) {
    // Create id key from id and collection id key
    const idKey = extendKey(this.collection._keys.idKey, id)

    // Add sum operation to atomic ops list
    this.operations.atomicFns.push((op) => op.sum(idKey, value))

    // Return current atomic operation builder
    return this
  }

  /**
   * Specifies atomic mutations to be formed on documents.
   *
   * **Example:**
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
  mutate(...mutations: AtomicMutation<T2>[]) {
    // Map from atomic mutations to kv mutations
    const kvMutations: Deno.KvMutation[] = mutations.map(({ id, ...rest }) => {
      const idKey = extendKey(this.collection._keys.idKey, id)
      return {
        key: idKey,
        ...rest,
      }
    })

    // Add mutation operation to atomic ops list
    this.operations.atomicFns.push((op) => op.mutate(...kvMutations))

    // Addtional checks
    kvMutations.forEach((mut) => {
      // If mutation type is "set", add check operation to atomic ops list
      if (mut.type === "set") {
        this.operations.atomicFns.push((op) =>
          op.check({
            key: mut.key,
            versionstamp: null,
          })
        )
      }

      // If collection is indexable, handle indexing
      if (this.collection instanceof IndexableCollection) {
        // Get collection id key
        const collectionIdKey = this.collection._keys.idKey

        // Get document id from mutation key
        const id = getDocumentId(mut.key)

        // If id is undefined, continue to next mutation
        if (typeof id === "undefined") {
          return
        }

        // If mutation type is "set", handle setting of indices
        if (mut.type === "set") {
          // Add collection key for collision detection
          this.operations.indexAddCollectionKeys.push(collectionIdKey)

          // Add indexing operations to atomic ops list
          this.operations.atomicFns.push((op) => {
            return setIndices(
              id,
              mut.value as Model,
              op,
              this.collection as unknown as IndexableCollection<
                Model,
                IndexableCollectionOptions<Model>
              >,
              {
                ...mut,
              },
            )
          })
        }

        // If mutation type is "delete", create and add delete preperation function
        if (mut.type === "delete") {
          // Add collection key for collision detection
          this.operations.indexDeleteCollectionKeys.push(collectionIdKey)

          // Add delete preperation function to delete preperation functions list
          this.operations.prepareDeleteFns.push(async (kv) => {
            const doc = await kv.get<Model>(mut.key)
            return {
              id,
              data: doc.value ?? {},
            }
          })
        }
      }
    })

    // Return current atomic operation builder
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
      // Return commit result with false flag if collisions are detected
      return {
        ok: false,
      }
    }

    // Prepare delete ops
    const preparedIndexDeletes = await allFulfilled(
      this.operations.prepareDeleteFns.map((fn) => fn(this.kv)),
    )

    // Perform atomic operation
    const atomicOperation = this.operations.atomicFns.reduce(
      (op, opFn) => opFn(op),
      this.kv.atomic(),
    )

    // Execute atomic operation
    const commitResult = await atomicOperation.commit()

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
            this.collection as unknown as IndexableCollection<
              Model,
              IndexableCollectionOptions<Model>
            >,
          )

          // Execute atomic operation
          await atomic.commit()
        }),
      )
    }

    // Return commit result
    return commitResult
  }
}

export function createAtomicBuilder<
  const T1 extends Schema<SchemaDefinition>,
  T2 extends KvValue,
>(
  kv: Deno.Kv,
  schema: T1,
  selector: CollectionSelector<T1, T2>,
  operations?: Operations,
) {
  // Select collection context
  const collection = selector(schema)

  // Check for large collection
  if (collection instanceof LargeCollection) {
    throw Error("Atomic operations are not supported for large collections.")
  }

  // Create new atomic builder
  return new AtomicBuilder(
    kv,
    schema,
    collection,
    operations,
  )
}
