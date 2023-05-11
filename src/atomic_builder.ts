import type { Collection } from "./collection.ts"
import type { Schema } from "./db.ts"
import { IndexDataEntry, IndexableCollection } from "./indexable_collection.ts"
import type { Document, KvId, KvValue, Model } from "./kvdb.types.ts"
import { generateId, extendKey, useKV } from "./kvdb.utils.ts"

// Types
export type CollectionSelector<TSchema extends Schema, TValue extends KvValue, TCollection extends Collection<TValue>> = 
  (schema: TSchema) => TCollection

export type AtomicOperationFn = (op: Deno.AtomicOperation) => Deno.AtomicOperation

export type KvAction = (kv: Deno.Kv) => Promise<void>

export type Operations = {
  atomicOps: AtomicOperationFn[],
  additionalOps: KvAction[]
}

export type AtomicCommitResult = {
  ok: true,
  versionstamp: Document<KvValue>["versionstamp"]
} |
{
  ok: false
}

export type AtomicCheck<TValue extends KvValue> = {
  id: Document<TValue>["id"],
  versionstamp: Document<TValue>["versionstamp"]
}

export type AtomicMutation<T extends KvValue> = {
  id: KvId
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
export class AtomicBuilder<const TSchema extends Schema, const TValue extends KvValue, const TCollection extends Collection<TValue>> {

  private schema: TSchema
  private operations: Operations
  protected collection: TCollection

  /**
   * Create a new AtomicBuilder for building and executing atomic operations.
   * 
   * @param schema - The database schema containing all accessible collections.
   * @param collection - The collection currently in context for building atomic operations.
   * @param operations - List of prepared operations from previous instance.
   */
  constructor(schema: TSchema, collection: TCollection, operations?: Operations) {
    this.schema = schema

    this.operations = operations ?? {
      atomicOps: [],
      additionalOps: []
    }

    this.collection = collection
  }

  /**
   * Select a new collection context.
   * 
   * @param selector - Selector function for selecting a new collection from the database schema.
   * @returns A new AtomicBuilder instance.
   */
  select<const TValue extends KvValue>(selector: CollectionSelector<TSchema, TValue, Collection<TValue>>) {
    return new AtomicBuilder(this.schema, selector(this.schema), this.operations)
  }
  
  /**
   * Add a new document to the KV store with a randomely generated id.
   * 
   * @param data - Document data to be added.
   * @returns Current AtomicBuilder instance.
   */
  add(data: TValue) {
    const id = generateId()
    const key = extendKey(this.collection.collectionKey, id)
    this.operations.atomicOps.push(op => op.set(key, data))

    if (this.collection instanceof IndexableCollection) {
      const collectionIndexKey = this.collection.collectionIndexKey
      Object.keys(this.collection.indexRecord).forEach(index => {
        const _data = data as Model
        const indexValue = _data[index] as KvId
        const indexKey = extendKey(collectionIndexKey, indexValue)
        const indexEntry: IndexDataEntry<typeof _data> = { id, ..._data }
        this.operations.atomicOps.push(op => op.set(indexKey, indexEntry))
      })
    }

    return this
  }

  /**
   * Adds a new document to the KV store with the given id.
   * 
   * @param id - Id of the document to be added.
   * @param data - Document data to be added.
   * @returns Current AtomicBuilder instance.
   */
  set(id: KvId, data: TValue) {
    const key = extendKey(this.collection.collectionKey, id)
    this.operations.atomicOps.push(op => op.set(key, data))

    if (this.collection instanceof IndexableCollection) {
      const collectionIndexKey = this.collection.collectionIndexKey
      Object.keys(this.collection.indexRecord).forEach(index => {
        const _data = data as Model
        const indexValue = _data[index] as KvId
        const indexKey = extendKey(collectionIndexKey, indexValue)
        const indexEntry: IndexDataEntry<typeof _data> = { id, ..._data }
        this.operations.atomicOps.push(op => op.set(indexKey, indexEntry))
      })
    }

    return this
  }

  /**
   * Deletes a document from the KV store with the given id.
   * 
   * @param id - Id of document to be deleted.
   * @returns Current AtomicBuilder instance.
   */
  delete(id: KvId) {
    const key = extendKey(this.collection.collectionKey, id)
    this.operations.atomicOps.push(op => op.delete(key))

    if (this.collection instanceof IndexableCollection) {
      const collectionIndexKey = this.collection.collectionIndexKey
      const indexRecord = this.collection.indexRecord

      this.operations.additionalOps.push(async kv => {
        const { value, versionstamp } = await kv.get<TValue>(key)
        
        if (value === null || versionstamp === null) return

        let atomic = kv.atomic()

        Object.keys(indexRecord).forEach(index => {
          const _value = value as Model
          const indexValue = _value[index] as KvId
          const indexKey = extendKey(collectionIndexKey, indexValue)
          atomic = atomic.delete(indexKey)
        })

        await atomic.commit()
      })
    }

    return this
  }

  /**
   * Check if documents have been changed since a specific versionstamp.
   * 
   * @param atomicChecks - AtomicCheck objects containing a document id and versionstamp.
   * @returns Current AtomicBuilder instance.
   */
  check(...atomicChecks: AtomicCheck<TValue>[]) {
    const checks: Deno.AtomicCheck[] = atomicChecks.map(({ id, versionstamp }) => {
      const key = extendKey(this.collection.collectionKey, id)
      return {
        key,
        versionstamp
      }
    })

    this.operations.atomicOps.push(op => op.check(...checks))
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
  sum(id: KvId, value: bigint) {
    const key = extendKey(this.collection.collectionKey, id)
    this.operations.atomicOps.push(op => op.sum(key, value))
    return this
  }

  /**
   * Specifies atomic mutations to be formed on documents.
   * 
   * @param mutations - Atomic mutations to be performed.
   * @returns Current AtomicBuilder instance.
   */
  mutate(...mutations: AtomicMutation<TValue>[]) {
    const kvMutations: Deno.KvMutation[] = mutations.map(({ id, ...rest }) => {
      const key = extendKey(this.collection.collectionKey, id)
      return {
        key,
        ...rest
      }
    })

    this.operations.atomicOps.push(op => op.mutate(...kvMutations))

    if (this.collection instanceof IndexableCollection) {
      const collectionKey = this.collection.collectionKey
      const collectionIndexKey = this.collection.collectionIndexKey
      const indexRecord = this.collection.indexRecord

      mutations.forEach(mut => {
        if (mut.type === "set") {
          Object.keys(indexRecord).forEach(index => {
            const data = mut.value as Model
            const indexValue = data[index] as KvId
            const indexKey = extendKey(collectionIndexKey, indexValue)
            const indexEntry: IndexDataEntry<typeof data> = { id: mut.id, ...data }
            this.operations.atomicOps.push(op => op.set(indexKey, indexEntry))
          })
        }

        if (mut.type === "delete") {
          this.operations.additionalOps.push(async kv => {
            const key = extendKey(collectionKey, mut.id)
            const { value, versionstamp } = await kv.get<TValue>(key)
            
            if (value === null || versionstamp === null) return
    
            let atomic = kv.atomic()
    
            Object.keys(indexRecord).forEach(index => {
              const _value = value as Model
              const indexValue = _value[index] as KvId
              const indexKey = extendKey(collectionIndexKey, indexValue)
              atomic = atomic.delete(indexKey)
            })
    
            await atomic.commit()
          })
        }
      })
    }

    return this
  }

  /**
   * Executes the built atomic operation.
   * 
   * @returns A promise that resolves to a Deno.KvCommitResult object if the operation is successful, or Deno.KvCommitError if not.
   */
  async commit() {
    return await useKV(async kv => {
      const atomicOperation = this.operations.atomicOps.reduce((op, opFn) => opFn(op), kv.atomic())
      const [commitResult] = await Promise.all([atomicOperation.commit(), ...this.operations.additionalOps.map(op => op(kv))])
      return commitResult
    })
  }
  
}