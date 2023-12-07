import type { Collection } from "./collection.ts"
import type { Document } from "./document.ts"

/*********************/
/*                   */
/*   UTILITY TYPES   */
/*                   */
/*********************/

export type BuilderFn = (
  ...args: any
) => any

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

export type ManyCommitResult = {
  ok: true
}

export type IdGenerator<T extends KvValue> = (data: T) => KvId

export type DenoCore = {
  deserialize<T>(data: Uint8Array): T
  serialize<T>(data: T): Uint8Array
  decode(data: Uint8Array): string
  encode(data: string): Uint8Array
}

/**********************/
/*                    */
/*   INTERVAL TYPES   */
/*                    */
/**********************/

export type SetIntervalOptions = {
  /**
   * Static or dynamic interval in milliseconds.
   *
   * @default 3_600_000 // Defaults to 1 hour
   */
  interval?: number | ((msg: IntervalMessage) => number | Promise<number>)

  /** Exit condition used to terminate the interval. */
  exitOn?: (msg: IntervalMessage) => boolean | Promise<boolean>

  /** Task to be run when terminating the interval, executed after `exitOn()` returns true. */
  onExit?: (msg: IntervalMessage) => unknown

  /**
   * Delay before running the first task.
   *
   * If not set, will run the first task immediately.
   */
  startDelay?: number

  /**
   * Number of retry attempts upon failed enqueue delivery.
   *
   * When all retry attempts are spent, the interval will terminate.
   *
   * @default 10
   */
  retry?: number
}

export type IntervalMessage = {
  /** Task number, starts at 0 for the first task. */
  count: number

  /** Previously set interval. Equal to `startDelay` or 0 for the first task. */
  interval: number

  /** Enqueue timestamp of current task. */
  timestamp: Date

  /** True if the current task is the first callback, false if not. */
  first: boolean
}

/******************/
/*                */
/*   LOOP TYPES   */
/*                */
/******************/

export type LoopOptions<T> = {
  /**
   * Static or dynamic delay in milliseconds.
   *
   * If not set, next callback is invoked immediately on task end.
   */
  delay?: number | ((msg: LoopMessage<T>) => number | Promise<number>)

  /** Exit condition used to terminate the loop. */
  exitOn?: (msg: LoopMessage<T>) => boolean | Promise<boolean>

  /** Task to be run when terminating the loop, executed after `exitOn()` returns true. */
  onExit?: (msg: LoopMessage<T>) => unknown

  /**
   * Delay before running the first task.
   *
   * If not set, will run the first task immediately.
   */
  startDelay?: number

  /**
   * Number of retry attempts upon failed enqueue delivery.
   *
   * When all retry attempts are spent, the loop will terminate.
   *
   * @default 10
   */
  retry?: number
}

export type LoopMessage<T> =
  & {
    /** Task number, starts at 0. */
    count: number

    /** Previously set delay, is equal to `startDelay` or 0 for the first task. */
    delay: number

    /** Enqueue timestamp of current task. */
    timestamp: Date
  }
  & (
    | {
      /** Result of prevous task. Is null for the first task. */
      result: T

      /** True if the current task is the first callback, false if not. */
      first: false
    }
    | {
      /** Result of prevous task. Is null for the first task. */
      result: null

      /** True if the current task is the first callback, false if not. */
      first: true
    }
  )

/****************************/
/*                          */
/*   ATOMIC BUILDER TYPES   */
/*                          */
/****************************/

export type CollectionSelector<
  TSchema extends Schema<SchemaDefinition>,
  TInput,
  TOutput extends KvValue,
> = (
  schema: TSchema,
) => Collection<TInput, TOutput, CollectionOptions<TOutput>>

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

export type AtomicMutation<T> =
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
      type: "add"
      value: T
      expireIn?: number
    }
    | {
      type: "sum"
      value: T extends Deno.KvU64 ? bigint : never
    }
    | {
      type: "min"
      value: T extends Deno.KvU64 ? bigint : never
    }
    | {
      type: "max"
      value: T extends Deno.KvU64 ? bigint : never
    }
    | {
      type: "delete"
    }
  )

export type AtomicSetOptions = NonNullable<
  Parameters<ReturnType<Deno.Kv["atomic"]>["set"]>["2"]
>

/************************/
/*                      */
/*   COLLECTION TYPES   */
/*                      */
/************************/

export type CollectionOptions<T extends KvValue> =
  & {
    idGenerator?: IdGenerator<T>
    serialize?: SerializeOptions
    history?: true
  }
  & (
    T extends KvObject ? {
        indices?: IndexRecord<T>
      }
      : { [K in never]: never }
  )

export type PossibleCollectionOptions = CollectionOptions<
  Record<string, never>
>

export type CollectionKeys = {
  base: KvKey
  id: KvKey
  primaryIndex: KvKey
  secondaryIndex: KvKey
  segment: KvKey
  undelivered: KvKey
  history: KvKey
  historySegment: KvKey
}

export type IdempotentListener = () => Promise<void>

export type ParseInputType<TInput, TOutput extends KvValue> = TInput extends
  KvValue ? TInput : TOutput

export type Model<TInput, TOutput extends KvValue> = {
  parse: (data: TInput) => TOutput
  __validate?: (data: unknown) => TOutput
}

export type WriteHistoryEntry<T> = {
  type: "write"
  timestamp: Date
  value: T
}

export type DeleteHistoryEntry = {
  type: "delete"
  timestamp: Date
}

export type HistoryEntry<T> = WriteHistoryEntry<T> | DeleteHistoryEntry

/*******************/
/*                 */
/*   INDEX TYPES   */
/*                 */
/*******************/

export type IndexType = "primary" | "secondary"

export type IndexRecord<T extends KvObject> = {
  [K in KeysOfThatExtend<T, KvValue | undefined>]?: IndexType
}

export type PrimaryIndexKeys<
  T1 extends KvValue,
  T2 extends CollectionOptions<T1>,
> = T2 extends { indices: IndexRecord<KvObject> }
  ? KeysOfThatExtend<T2["indices"], "primary">
  : never

export type SecondaryIndexKeys<
  T1 extends KvValue,
  T2 extends CollectionOptions<T1>,
> = T2 extends { indices: IndexRecord<KvObject> }
  ? KeysOfThatExtend<T2["indices"], "secondary">
  : never

export type IndexDataEntry<T extends KvObject> = Omit<T, "__id__"> & {
  __id__: KvId
}

/***********************/
/*                     */
/*   SERIALIZE TYPES   */
/*                     */
/***********************/

export type Serializer = {
  serialize: <T>(data: T) => Uint8Array
  deserialize: <T>(data: Uint8Array) => T
  compress: (data: Uint8Array) => Uint8Array
  decompress: (data: Uint8Array) => Uint8Array
}

export type SerializedEntry = {
  ids: KvId[]
}

export type SerializeOptions = "auto" | "core" | "json" | Partial<Serializer>

/***************************/
/*                         */
/*   METHOD OPTION TYPES   */
/*                         */
/***************************/

export type SetOptions = NonNullable<Parameters<Deno.Kv["set"]>["2"]> & {
  /** Number of retry attempts before returning failed operation */
  retry?: number

  /**
   * Whether the operation should overwrite an existing document with the same id or not.
   *
   * @default false
   */
  overwrite?: boolean
}

export type ListOptions<T extends KvValue> = Deno.KvListOptions & {
  /**
   * Filter documents based on predicate.
   *
   * @param doc - Document.
   * @returns true or false.
   */
  filter?: (doc: Document<T>) => boolean

  /** Id of document to start from. */
  startId?: KvId

  /** Id of document to end at. */
  endId?: KvId
}

export type AtomicBatchOptions = {
  /** Batch size of atomic operations where applicable */
  atomicBatchSize?: number
}

export type AtomicListOptions<T extends KvValue> =
  & ListOptions<T>
  & AtomicBatchOptions

export type CountOptions<T extends KvValue> =
  & CountAllOptions
  & Pick<ListOptions<T>, "filter">

export type FindOptions = NonNullable<Parameters<Deno.Kv["get"]>[1]>

export type FindManyOptions = NonNullable<Parameters<Deno.Kv["getMany"]>[1]>

export type UpdateOptions = Omit<SetOptions, "overwrite"> & {
  /**
   * Strategy when merging objects.
   *
   * @default "shallow"
   */
  mergeType?: MergeType
}

export type MergeType = "shallow" | "deep"

export type UpdateManyOptions<T extends KvValue> =
  & ListOptions<T>
  & UpdateOptions

export type CountAllOptions = Pick<ListOptions<KvValue>, "consistency">

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

export type WatchOptions = NonNullable<Parameters<Deno.Kv["watch"]>[1]>

/********************/
/*                  */
/*   SCHEMA TYPES   */
/*                  */
/********************/

export type SchemaDefinition = {
  [key: string]: SchemaDefinition | BuilderFn
}

export type Schema<T extends SchemaDefinition> = {
  [K in keyof T]: T[K] extends SchemaDefinition ? Schema<T[K]>
    : T[K] extends BuilderFn ? ReturnType<T[K]>
    : never
}

/*******************/
/*                 */
/*   QUEUE TYPES   */
/*                 */
/*******************/

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

export type QueueMessageHandler<T extends QueueValue> = (data: T) => unknown

export type PreparedEnqueue<T extends QueueValue> = {
  msg: QueueMessage<T>
  options: KvEnqueueOptions
}

export type QueueHandlers = Map<string, QueueMessageHandler<QueueValue>[]>

/******************/
/*                */
/*   DATA TYPES   */
/*                */
/******************/

export type UpdateData<T extends KvValue> = T extends KvObject ? Partial<T>
  : T

export type FlatDocumentData<T extends KvValue> =
  & Omit<DocumentData<T>, "value">
  & (
    T extends KvObject ? T : {
      readonly value: T
    }
  )

export type DocumentData<T> = {
  readonly id: KvId
  readonly versionstamp: KvVersionstamp<KvValue>
  readonly value: T
}

/****************/
/*              */
/*   KV TYPES   */
/*              */
/****************/

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
