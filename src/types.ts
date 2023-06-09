import type { Collection } from "./collection.ts"
import type { AtomicBuilder } from "./atomic_builder.ts"

// Atomic Builder Types
export type CollectionSelector<
  T1 extends Schema,
  T2 extends KvValue,
> = (schema: T1) => Collection<T2>

export type AtomicOperationFn = (
  op: Deno.AtomicOperation,
) => Deno.AtomicOperation

export type PrepareDeleteFn = (kv: Deno.Kv) => Promise<PreparedIndexDelete>

export type PreparedIndexDelete = {
  id: KvId
  data: Model
  primaryCollectionIndexKey: KvKey
  secondaryCollectionIndexKey: KvKey
  primaryIndexList: string[]
  secondaryIndexList: string[]
}

export type Operations = {
  atomicFns: AtomicOperationFn[]
  prepareDeleteFns: PrepareDeleteFn[]
  indexDeleteCollectionKeys: KvKey[]
  indexAddCollectionKeys: KvKey[]
}

export type AtomicCommitResult =
  | {
    ok: true
    versionstamp: Document<KvValue>["versionstamp"]
  }
  | {
    ok: false
  }

export type AtomicCheck<T extends KvValue> = {
  id: Document<T>["id"]
  versionstamp: Document<T>["versionstamp"]
}

export type AtomicMutation<T extends KvValue> =
  & {
    id: KvId
  }
  & (
    | {
      type: "set"
      value: T
    }
    | {
      type: "sum"
      value: T extends Deno.KvU64 ? T : never
    }
    | {
      type: "min"
      value: T extends Deno.KvU64 ? T : never
    }
    | {
      type: "max"
      value: T extends Deno.KvU64 ? T : never
    }
    | {
      type: "delete"
    }
  )

// Collection Types
export type CollectionKeys = {
  baseKey: KvKey
  idKey: KvKey
}

export type ListOptions<T extends KvValue> = Deno.KvListOptions & {
  /**
   * Filter documents based on predicate.
   *
   * @param doc - Document
   * @returns true or false
   */
  filter?: (doc: Document<T>) => boolean
}

export type FindOptions = Parameters<Deno.Kv["get"]>[1]

export type FindManyOptions = Parameters<Deno.Kv["getMany"]>[1]

export type CommitResult<T1 extends KvValue, T2 extends KvId> = {
  ok: true
  versionstamp: Document<T1>["versionstamp"]
  id: T2
} | {
  ok: false
}

// Indexable Collection Types
export type IndexableCollectionKeys = CollectionKeys & {
  primaryIndexKey: KvKey
  secondaryIndexKey: KvKey
}

export type CheckKeyOf<K, T> = K extends keyof T ? T[K] : never

export type IndexType = "primary" | "secondary"

export type KeysThatExtend<T1, T2> = keyof {
  [K in keyof T1 as T1[K] extends T2 ? K : never]: unknown
}

export type IndexRecord<T extends Model> = {
  [key in KeysThatExtend<T, KvId>]?: IndexType
}

export type PrimaryIndexSelection<
  T1 extends Model,
  T2 extends IndexRecord<T1>,
> = {
  [K in KeysThatExtend<T2, "primary">]?: CheckKeyOf<K, T1>
}

export type SecondaryIndexSelection<
  T1 extends Model,
  T2 extends IndexRecord<T1>,
> = {
  [K in KeysThatExtend<T2, "secondary">]?: CheckKeyOf<K, T1>
}

export type IndexDataEntry<T extends Model> = Omit<T, "__id__"> & {
  __id__: KvId
}

// DB Types
export type Schema = {
  [key: string]: Collection<KvValue> | Schema
}

export type DB<TSchema extends Schema> = TSchema & {
  /**
   * Initiates an atomic operation.
   * Takes a selector function as argument which is used to select an initial collection.
   *
   * **Example:**
   * ```ts
   * db.atomic(schema => schema.users)
   * ```
   *
   * @param selector - Collection selector function.
   * @returns A new AtomicBuilder instance.
   */
  atomic: <
    const TValue extends KvValue,
  >(
    selector: CollectionSelector<TSchema, TValue>,
  ) => AtomicBuilder<TSchema, TValue>
}

// KV Types
export type UpdateData<T extends KvValue> = T extends KvObject ? Partial<T> : T

export type FlattenedDocument<T extends Model> = T & {
  id: Document<T>["id"]
  versionstamp: Document<T>["versionstamp"]
}

export type Document<T extends KvValue> = {
  id: KvId
  versionstamp: Deno.KvEntry<T>["versionstamp"]
  value: T
}

export type KvKey = [Deno.KvKeyPart, ...Deno.KvKey]

export type KvId = Deno.KvKeyPart

export type Model = KvObject

export type KvObject = {
  [key: string | number]: KvValue
}

export type KvArray = KvValue[]

export type KvValue =
  | undefined
  | null
  | string
  | number
  | boolean
  | bigint
  | Deno.KvU64
  | KvObject
  | KvArray
  | Int8Array
  | Int16Array
  | Int32Array
  | BigInt64Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | BigUint64Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array
  | ArrayBuffer
  | Date
  | Set<unknown>
  | Map<unknown, unknown>
  | RegExp
  | DataView
  | Error
