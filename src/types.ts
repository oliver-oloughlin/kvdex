import type { Collection } from "./collection.ts"
import type { AtomicBuilder } from "./atomic_builder.ts"
import type { LargeCollection } from "./large_collection.ts"

// Atomic Builder Types
export type CollectionSelector<
  T1 extends Schema<SchemaDefinition>,
  T2 extends KvValue,
> = (schema: AtomicSchema<T1>) => Collection<T2, CollectionOptions<T2>>

export type AtomicSchema<T extends Schema<SchemaDefinition>> = {
  [
    K in KeysOfThatDontExtend<
      T,
      LargeCollection<LargeKvValue, LargeCollectionOptions<LargeKvValue>>
    >
  ]: T[K] extends Schema<SchemaDefinition> ? AtomicSchema<T[K]> : T[K]
}

export type AtomicOperationFn = (
  op: Deno.AtomicOperation,
) => Deno.AtomicOperation

export type PrepareDeleteFn = (kv: Deno.Kv) => Promise<PreparedIndexDelete>

export type PreparedIndexDelete = {
  id: KvId
  data: Model
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
export type IdGenerator<T extends KvValue> = (data: T) => KvId

export type CollectionOptions<T extends KvValue> = {
  /**
   * Set a custom function for automatic id generation.
   */
  idGenerator?: IdGenerator<T>
}

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

export type CountOptions<T extends KvValue> =
  & CountAllOptions
  & Pick<ListOptions<T>, "filter">

export type FindOptions = Parameters<Deno.Kv["get"]>[1]

export type FindManyOptions = Parameters<Deno.Kv["getMany"]>[1]

export type CommitResult<T1 extends KvValue> = {
  ok: true
  versionstamp: Document<T1>["versionstamp"]
  id: KvId
} | {
  ok: false
}

// Indexable Collection Types
export type IndexableCollectionOptions<T extends Model> =
  & CollectionOptions<T>
  & {
    indices: IndexRecord<T>
  }

export type IndexableCollectionKeys = CollectionKeys & {
  primaryIndexKey: KvKey
  secondaryIndexKey: KvKey
}

export type CheckKeyOf<K, T> = K extends keyof T ? T[K] : never

export type IndexType = "primary" | "secondary"

export type KeysOfThatExtend<T1, T2> = keyof {
  [K in keyof T1 as T1[K] extends T2 ? K : never]: unknown
}

export type KeysOfThatDontExtend<T1, T2> = keyof {
  [K in keyof T1 as T1[K] extends T2 ? never : K]: unknown
}

export type IndexRecord<T extends Model> = {
  [key in KeysOfThatExtend<T, KvId>]?: IndexType
}

export type PrimaryIndexKeys<T1 extends Model, T2 extends IndexRecord<T1>> =
  KeysOfThatExtend<T2, "primary">

export type SecondaryIndexKeys<T1 extends Model, T2 extends IndexRecord<T1>> =
  KeysOfThatExtend<T2, "secondary">

export type IndexDataEntry<T extends Model> = Omit<T, "__id__"> & {
  __id__: KvId
}

// Large Collection Types
export type LargeCollectionOptions<T extends LargeKvValue> = CollectionOptions<
  T
>

export type LargeCollectionKeys = CollectionKeys & {
  segmentKey: KvKey
}

export type LargeDocumentEntry = {
  ids: KvId[]
}

// DB Types
export type CollectionBuilderFn = (
  kv: Deno.Kv,
  key: KvKey,
) => Collection<KvValue, CollectionOptions<KvValue>>

export type SchemaDefinition = {
  [key: string]: SchemaDefinition | CollectionBuilderFn
}

export type Schema<T extends SchemaDefinition> = {
  [K in keyof T]: T[K] extends SchemaDefinition ? Schema<T[K]>
    : T[K] extends CollectionBuilderFn ? ReturnType<T[K]>
    : never
}

export type DB<T extends SchemaDefinition> = Schema<T> & {
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
  atomic<
    const TValue extends KvValue,
  >(
    selector: CollectionSelector<Schema<T>, TValue>,
  ): AtomicBuilder<Schema<T>, TValue>

  /**
   * Count all document entries in the KV store.
   *
   * **Example:**
   * ```ts
   * // Returns the total number of documents in the KV store across all collections
   * const count = await db.countAll()
   * ```
   *
   * @param options
   * @returns A promise that resolves to a number representing the total count of documents in the KV store.
   */
  countAll(options?: CountAllOptions): Promise<number>

  /**
   * Delete all document entries in the KV store.
   *
   * **Example:**
   * ```ts
   * // Deletes all documents across all collections
   * await db.deleteAll()
   * ```
   *
   * @returns A promise that resolves to void.
   */
  deleteAll(options?: DeleteAllOptions): Promise<void>

  /**
   * Add data to the database queue to be delivered to the queue listener
   * via ``db.listenQueue()``. The data will only be received by queue
   * listeners on the database queue. The method takes an optional options
   * argument that can be used to set a delivery delay.
   *
   * **Example:**
   * ```ts
   * // Immediate delivery
   * await db.enqueue("some data")
   *
   * // Delay of 2 seconds before delivery
   * await db.enqueue("some data", {
   *   delay: 2_000
   * })
   * ```
   *
   * @param data
   * @param options
   */
  enqueue(data: unknown, options?: EnqueueOptions): EnqueueResult

  /**
   * Listen for data from the database queue that was enqueued with ``db.enqueue()``. Will only receive data that was enqueued to the database queue. Takes a handler function as argument.
   *
   * **Example:**
   * ```ts
   * // Prints the data to console when recevied
   * db.listenQueue((data) => console.log(data))
   *
   * // Sends post request when data is received
   * db.listenQueue(async (data) => {
   *   const dataBody = JSON.stringify(data)
   *
   *   const res = await fetch("...", {
   *     method: "POST",
   *     body: dataBody
   *   })
   *
   *   console.log("POSTED:", dataBody, res.ok)
   * })
   * ```
   *
   * @param handler
   */
  listenQueue(handler: QueueMessageHandler): ListenQueueResult
}

export type CountAllOptions = Pick<Deno.KvListOptions, "consistency">

export type DeleteAllOptions = Pick<Deno.KvListOptions, "consistency">

// Queue Types
export type QueueMessage = {
  collectionKey: KvKey | null
  data: unknown
}

export type ParsedQueueMessage = {
  ok: true
  msg: QueueMessage
} | {
  ok: false
}

export type EnqueueOptions = Omit<
  NonNullable<Parameters<Deno.Kv["enqueue"]>[1]>,
  "keysIfUndelivered"
>

export type EnqueueResult = ReturnType<Deno.Kv["enqueue"]>

export type ListenQueueResult = ReturnType<Deno.Kv["listenQueue"]>

export type QueueMessageHandler = (data: unknown) => unknown | Promise<unknown>

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
  [K: string | number]: KvValue
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
  | Set<KvValue>
  | Map<KvValue, KvValue>
  | RegExp
  | DataView
  | Error

export type LargeKvObject = {
  [K: string | number]: LargeKvValue | number | boolean | undefined | null
}

export type LargeKvArray =
  (LargeKvValue | number | boolean | undefined | null)[]

export type LargeKvValue =
  | string
  | LargeKvObject
  | LargeKvArray
