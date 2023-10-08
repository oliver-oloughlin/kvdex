import type { Collection } from "./collection.ts"
import type { LargeCollection } from "./large_collection.ts"
import type { Document } from "./document.ts"

// Utility Types
export type CollectionBuilderFn = (
  kv: Deno.Kv,
  key: KvKey,
  queueHandlers: Map<string, QueueMessageHandler<QueueValue>[]>,
  idempotentListener: () => void,
) => Collection<KvValue, CollectionOptions<KvValue>>

export type CheckKeyOf<K, T> = K extends keyof T ? T[K] : never

export type KeysOfThatExtend<T1, T2> = keyof {
  [K in keyof T1 as T1[K] extends T2 ? K : never]: unknown
}

export type KeysOfThatDontExtend<T1, T2> = keyof {
  [K in keyof T1 as T1[K] extends T2 ? never : K]: unknown
}

export type CommitResult<T1 extends KvValue> = {
  ok: true
  versionstamp: Document<T1>["versionstamp"]
  id: KvId
}

export type IdGenerator<T extends KvValue> = (data: T) => KvId

// Cron types
export type CronOptions = {
  /**
   * Interval in milliseconds for cron job.
   *
   * @default 3_600_000 // Defaults to 1 hour
   */
  interval?: number

  /** Conditionally set the next interval in milliseconds. */
  setInterval?: (msg: CronMessage) => number | Promise<number>

  /** Exit predicate used to end cron job. */
  exitOn?: (msg: CronMessage) => boolean | Promise<boolean>

  /** Task to be run when terminating a cron job (after ```exitOn()``` returns true) */
  onExit?: (msg: CronMessage) => unknown

  /**
   * Delay before running the first job.
   *
   * If not set, will run first job immediately.
   */
  startDelay?: number

  /**
   * Number of retry attempts upon failed job deliver.
   *
   * When all retry attempts are spent the cron job will exit.
   *
   * @default 10
   */
  retry?: number
}

export type CronMessage = {
  /** Job number, starts at 0. */
  count: number

  /** Previously set interval. */
  previousInterval: number

  /** Indicates whether the current job is the first to be run. */
  isFirstJob: boolean

  /**
   * Timestamp of enqueue.
   *
   * Equal to the start time of the previous job.
   */
  enqueueTimestamp: Date
}

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

export type PrepareDeleteFn = (kv: Deno.Kv) => Promise<PreparedIndexDelete>

export type PreparedIndexDelete = {
  id: KvId
  data: KvObject
}

export type Operations = {
  atomic: Deno.AtomicOperation
  prepareDeleteFns: PrepareDeleteFn[]
  indexDeleteCollectionKeys: KvKey[]
  indexAddCollectionKeys: KvKey[]
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
      expireIn?: number
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

export type AtomicSetOptions = NonNullable<
  Parameters<ReturnType<Deno.Kv["atomic"]>["set"]>["2"]
>

// Collection Types
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

export type Model<T> = {
  parse: (data: unknown) => T
}

// Indexable Collection Types
export type IndexableCollectionOptions<T extends KvObject> =
  & CollectionOptions<T>
  & {
    indices: IndexRecord<T>
  }

export type IndexableCollectionKeys = CollectionKeys & {
  primaryIndexKey: KvKey
  secondaryIndexKey: KvKey
}

export type IndexType = "primary" | "secondary"

export type IndexRecord<T extends KvObject> = {
  [key in KeysOfThatExtend<T, KvId>]?: IndexType
}

export type PrimaryIndexKeys<T1 extends KvObject, T2 extends IndexRecord<T1>> =
  KeysOfThatExtend<T2, "primary">

export type SecondaryIndexKeys<
  T1 extends KvObject,
  T2 extends IndexRecord<T1>,
> = KeysOfThatExtend<T2, "secondary">

export type IndexDataEntry<T extends KvObject> = Omit<T, "__id__"> & {
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

// Method Option types
export type SetOptions = NonNullable<Parameters<Deno.Kv["set"]>["2"]> & {
  retry?: number
}

export type ListOptions<T extends KvValue> = Deno.KvListOptions & {
  /**
   * Filter documents based on predicate.
   *
   * @param doc - Document
   * @returns true or false
   */
  filter?: (doc: Document<T>) => boolean

  startId?: KvId

  endId?: KvId
}

export type CountOptions<T extends KvValue> =
  & CountAllOptions
  & Pick<ListOptions<T>, "filter">

export type FindOptions = NonNullable<Parameters<Deno.Kv["get"]>[1]>

export type FindManyOptions = NonNullable<Parameters<Deno.Kv["getMany"]>[1]>

export type UpdateManyOptions<T extends KvValue> = ListOptions<T> & SetOptions

export type CountAllOptions = Pick<Deno.KvListOptions, "consistency">

export type DeleteAllOptions = Pick<Deno.KvListOptions, "consistency">

export type EnqueueOptions =
  & Omit<
    KvEnqueueOptions,
    "keysIfUndelivered"
  >
  & {
    idsIfUndelivered?: KvId[]
    topic?: string
  }

export type QueueListenerOptions = {
  topic?: string
}

// Schema Types
export type SchemaDefinition = {
  [key: string]: SchemaDefinition | CollectionBuilderFn
}

export type Schema<T extends SchemaDefinition> = {
  [K in keyof T]: T[K] extends SchemaDefinition ? Schema<T[K]>
    : T[K] extends CollectionBuilderFn ? ReturnType<T[K]>
    : never
}

// Queue Types
export type QueueValue = Exclude<KvValue, undefined>

export type QueueMessage<T extends QueueValue> = {
  __handlerId__: string
  __data__: T
}

export type ParsedQueueMessage<T extends QueueValue> = {
  ok: true
  msg: QueueMessage<T>
} | {
  ok: false
}

export type EnqueueResult = Awaited<ReturnType<Deno.Kv["enqueue"]>>

export type QueueMessageHandler<T extends QueueValue> = (data: T) => unknown

export type PreparedEnqueue<T extends QueueValue> = {
  msg: QueueMessage<T>
  options: KvEnqueueOptions
}

// Data Types
export type UpdateData<T extends KvValue> = T extends KvObject ? Partial<T> : T

export type FlatDocumentData<T extends KvValue> =
  & Omit<DocumentData<T>, "value">
  & (
    T extends KvObject ? T : {
      readonly value: T
    }
  )

export type DocumentData<T extends KvValue> = {
  readonly id: KvId
  readonly versionstamp: KvVersionstamp<T>
  readonly value: T
}

// KV Types
export type KvEnqueueOptions = NonNullable<
  Parameters<Deno.Kv["enqueue"]>[1]
>

export type KvVersionstamp<T extends KvValue> = Deno.KvEntry<T>["versionstamp"]

export type KvKey = [Deno.KvKeyPart, ...Deno.KvKey]

export type KvId = Deno.KvKeyPart

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
