import type { Collection, CollectionKey } from "./collection.ts"
import type { Schema } from "./db.ts"
import type { Document, DocumentId, KvValue } from "./kvdb.types.ts"
import { generateId, getDocumentKey, useKV } from "./kvdb.utils.ts"

// Types
export type CollectionSelector<T1 extends Schema, T2 extends KvValue> = (schema: T1) => Collection<T2>

export type AtomicOperationFn = (op: Deno.AtomicOperation) => Deno.AtomicOperation

export type AtomicCommitResult = {
  ok: true,
  versionstamp: Document<KvValue>["versionstamp"]
} |
{
  ok: false
}

export type AtomicCheck<T extends KvValue> = {
  id: Document<T>["id"],
  versionstamp: Document<T>["versionstamp"]
}

export type AtomicMutation<T extends KvValue> = {
  id: DocumentId
} & (
  {
    type: "set",
    value: T
  } |
  {
    type: "sum",
    value: Deno.KvU64
  } |
  {
    type: "min",
    value: Deno.KvU64
  } |
  {
    type: "max",
    value: Deno.KvU64
  } |
  {
    type: "delete"
  }
)

// AtomicBuilder class
export class AtomicBuilder<const T1 extends Schema, const T2 extends KvValue> {

  private schema: T1
  private collectionKey: CollectionKey
  private operations: AtomicOperationFn[]

  /**
   * Create a new AtomicBuilder for building and executing atomic operations.
   * 
   * @param schema - The database schema containing all accessible collections.
   * @param collection - The collection currently in context for building atomic operations.
   * @param operations - List of prepared operations from previous instance.
   */
  constructor(schema: T1, collection: Collection<T2>, operations?: AtomicOperationFn[]) {
    this.schema = schema
    this.collectionKey = collection.collectionKey
    this.operations = operations ? operations : []
  }

  /**
   * Select a new collection context.
   * 
   * @param selector - Selector function for selecting a new collection from the database schema.
   * @returns A new AtomicBuilder instance.
   */
  select<const Value extends KvValue>(selector: CollectionSelector<T1, Value>) {
    return new AtomicBuilder(this.schema, selector(this.schema), this.operations)
  }
  
  /**
   * Add a new document to the KV store with a randomely generated id.
   * 
   * @param data - Document data to be added.
   * @returns Current AtomicBuilder instance.
   */
  add(data: T2) {
    const id = generateId()
    const key = getDocumentKey(this.collectionKey, id)
    this.operations.push(op => op.set(key, data))
    return this
  }

  /**
   * Adds a new document to the KV store with the given id.
   * 
   * @param id - Id of the document to be added.
   * @param data - Document data to be added.
   * @returns Current AtomicBuilder instance.
   */
  set(id: DocumentId, data: T2) {
    const key = getDocumentKey(this.collectionKey, id)
    this.operations.push(op => op.set(key, data))
    return this
  }

  /**
   * Deletes a document from the KV store with the given id.
   * 
   * @param id - Id of document to be deleted.
   * @returns Current AtomicBuilder instance.
   */
  delete(id: DocumentId) {
    const key = getDocumentKey(this.collectionKey, id)
    this.operations.push(op => op.delete(key))
    return this
  }

  /**
   * Check if documents have been changed since a specific versionstamp.
   * 
   * @param atomicChecks - AtomicCheck objects containing a document id and versionstamp.
   * @returns Current AtomicBuilder instance.
   */
  check(...atomicChecks: AtomicCheck<T2>[]) {
    const checks: Deno.AtomicCheck[] = atomicChecks.map(({ id, versionstamp }) => {
      const key = getDocumentKey(this.collectionKey, id)
      return {
        key,
        versionstamp
      }
    })

    this.operations.push(op => op.check(...checks))
    return this
  }

  /**
   * Adds the given value to the value of the document with the given id.
   * Sum only works for documents of type Deno.KvU64 and will throw an error for documents of any other type.
   * 
   * @param id - Id of document that contains the value to be updated.
   * @param value - The value to add to the document value.
   * @returns Current AtomicBuilder instance.
   */
  sum(id: DocumentId, value: bigint) {
    const key = getDocumentKey(this.collectionKey, id)
    this.operations.push(op => op.sum(key, value))
    return this
  }

  /**
   * Specifies atomic mutations to be formed on documents.
   * 
   * @param mutations - Atomic mutations to be performed.
   * @returns Current AtomicBuilder instance.
   */
  mutate(...mutations: AtomicMutation<T2>[]) {
    const kvMutations: Deno.KvMutation[] = mutations.map(({ id, ...rest }) => {
      const key = getDocumentKey(this.collectionKey, id)
      return {
        key,
        ...rest
      }
    })

    this.operations.push(op => op.mutate(...kvMutations))
    return this
  }

  /**
   * Executes the built atomic operation.
   * 
   * @returns A promise that resolves to a Deno.KvCommitResult object if the operation is successful, or Deno.KvCommitError if not.
   */
  async commit() {
    return await useKV(async kv => {
      const operation = this.operations.reduce((op, opFn) => opFn(op), kv.atomic())
      return await operation.commit()
    })
  }
  
}