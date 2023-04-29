import { Collection, CollectionKey } from "./collection.ts"
import type { Schema } from "./db.ts"
import type { Document, DocumentId, KvValue } from "./kvdb.types.ts"
import { generateDocumentId, getDocumentKey, useKV } from "./utils.ts"

export type CollectionSelector<T1 extends Schema, T2 extends KvValue> = (schema: T1) => Collection<T2>

export type AtomicOperationFn = (op: Deno.AtomicOperation) => Deno.AtomicOperation

export type AtomicCommitResult = {
  versionstamp: Document<KvValue>["versionstamp"]
}

export type AtomicCheck<T extends KvValue> = {
  id: Document<T>["id"],
  versionstamp: Document<T>["versionstamp"]
}

export class AtomicBuilder<T1 extends Schema, T2 extends KvValue> {

  private schema: T1
  private collectionKey: CollectionKey
  private operations: AtomicOperationFn[]

  constructor(schema: T1, collection: Collection<T2>, operations?: AtomicOperationFn[]) {
    this.schema = schema
    this.collectionKey = collection.getCollectionKey()
    this.operations = operations ? operations : []
  }

  select<const Value extends KvValue>(selector: CollectionSelector<T1, Value>) {
    return new AtomicBuilder(this.schema, selector(this.schema), this.operations)
  }
  
  add(data: T2) {
    const id = generateDocumentId()
    const key = getDocumentKey(this.collectionKey, id)
    this.operations.push(op => op.set(key, data))
    return this
  }

  set(id: DocumentId, data: T2) {
    const key = getDocumentKey(this.collectionKey, id)
    this.operations.push(op => op.set(key, data))
    return this
  }

  delete(id: DocumentId) {
    const key = getDocumentKey(this.collectionKey, id)
    this.operations.push(op => op.delete(key))
    return this
  }

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

  sum(id: DocumentId, value: bigint) {
    const key = getDocumentKey(this.collectionKey, id)
    this.operations.push(op => op.sum(key, value))
    return this
  }

  async commit() {
    return await useKV(async kv => {
      const operation = this.operations.reduce((op, opFn) => opFn(op), kv.atomic())
      const cr = await operation.commit()
      const success = !!cr?.versionstamp

      const result: AtomicCommitResult | null = !success ? null : {
        versionstamp: cr?.versionstamp
      }

      return result
    })
  }
  
}