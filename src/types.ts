import type { Collection } from "./collection.ts"
import type { DeepMergeOptions } from "./deps.ts"
import type { Document } from "./document.ts"

/*********************/
/*                   */
/*   UTILITY TYPES   */
/*                   */
/*********************/

/** Collection builder function */
export type BuilderFn<
  TInput,
  TOutput extends KvValue,
  TOptions extends CollectionOptions<TOutput>,
> = (
  kv: Deno.Kv,
  key: KvKey,
  queueHandlers: QueueHandlers,
  idempotentListener: IdempotentListener,
) => Collection<TInput, TOutput, TOptions>

/** Any collection builder function */
export type BuilderFnAny = (...args: any[]) => any

/** An idempotent listener invoker */
export type IdempotentListener = () => Promise<void>

/** Utility type for checking if K is a valid key of T */
export type CheckKeyOf<K, T> = K extends keyof T ? T[K] : never

/** Utility type for selecting keys of object T1 that extend T2 */
export type KeysOfThatExtend<T1, T2> = keyof {
  [K in keyof T1 as T1[K] extends T2 ? K : never]: unknown
}

/** Utility type for selecting keys of object T1 that do not extend T2 */
export type KeysOfThatDontExtend<T1, T2> = keyof {
  [K in keyof T1 as T1[K] extends T2 ? never : K]: unknown
}

/** Successful commit result object */
export type CommitResult<T1 extends KvValue> = {
  ok: true
  versionstamp: Document<T1>["versionstamp"]
  id: KvId
}

/** Many commit result object */
export type ManyCommitResult = {
  ok: true
}

/** Pagination object containing last cursor */
export type Pagination = {
  cursor: string | undefined
}

/** Pagination result object containing last cursor and result array */
export type PaginationResult<T> = Pagination & {
  result: T[]
}

/** Id generator function */
export type IdGenerator<T extends KvValue> = (data: T) => KvId

/** Deno core utility type */
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

/** Either static or dynamic interval value */
export type IntervalSetter =
  | number
  | ((msg: IntervalMessage) => number | Promise<number>)

/** Options for creating a new interval */
export type SetIntervalOptions = {
  /** Condition used to determine if the interval should continue running */
  while?: (msg: IntervalMessage) => boolean | Promise<boolean>

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

/** Contents of interval megssage */
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

/** Options for creating a new loop */
export type LoopOptions<T> = {
  /**
   * Static or dynamic delay in milliseconds.
   *
   * If not set, next callback is invoked immediately on task end.
   */
  delay?: number | ((msg: LoopMessage<T>) => number | Promise<number>)

  /** Condition used to determine if the loop should continue running */
  while?: (msg: LoopMessage<T>) => boolean | Promise<boolean>

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

/** Contents of loop message */
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

/** Collection selector function for an atomic builder */
export type CollectionSelector<
  TSchema extends Schema<SchemaDefinition>,
  TInput,
  TOutput extends KvValue,
> = (
  schema: TSchema,
) => Collection<TInput, TOutput, CollectionOptions<TOutput>>

/** Prepared value delete function */
export type PrepareDeleteFn = (kv: Deno.Kv) => Promise<PreparedIndexDelete>

/** Prepared index delete function */
export type PreparedIndexDelete = {
  id: KvId
  data: KvObject
}

/** Atomic builder operations */
export type Operations = {
  atomic: Deno.AtomicOperation
  prepareDeleteFns: PrepareDeleteFn[]
  indexDeleteCollectionKeys: KvKey[]
  indexAddCollectionKeys: KvKey[]
}

/** Kvdex atomic check */
export type AtomicCheck<T extends KvValue> = {
  /** Id of document to check */
  id: Document<T>["id"]

  /** Versionstamp of document to check */
  versionstamp: Document<T>["versionstamp"]
}

/** Atomic mutation object */
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

/** Options for atomic set operation */
export type AtomicSetOptions = NonNullable<
  Parameters<ReturnType<Deno.Kv["atomic"]>["set"]>["2"]
>

/************************/
/*                      */
/*   COLLECTION TYPES   */
/*                      */
/************************/

/** Options for creating a new collection */
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

/** Utility type for accessing all possible collection options */
export type PossibleCollectionOptions = CollectionOptions<
  Record<string, never>
>

/** Record of all collection keys */
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

/** Parses the input type of a model */
export type ParseInputType<TInput, TOutput extends KvValue> = TInput extends
  KvValue ? TInput : TOutput

/**
 * Model describing the input and output type of data.
 * Contains a parse function, and optionally a `__validate()` function used instead of parse upon reading data.
 */
export type Model<TInput, TOutput extends KvValue> = {
  /** A parse function that takes an input type and returns an output type */
  parse: (data: TInput) => TOutput

  /**
   * An optional validate function that takes any input value and returns an output type.
   *
   * Is used instead of `parse()` upon reading a document.
   */
  __validate?: (data: unknown) => TOutput
}

/** Historic write entry */
export type WriteHistoryEntry<T> = {
  type: "write"
  timestamp: Date
  value: T
}

/** Historic delete entry */
export type DeleteHistoryEntry = {
  type: "delete"
  timestamp: Date
}

/** Historic document entry */
export type HistoryEntry<T> = WriteHistoryEntry<T> | DeleteHistoryEntry

/*******************/
/*                 */
/*   INDEX TYPES   */
/*                 */
/*******************/

/** Type of index. "primary" is unique, while "secondary" is non-unique. */
export type IndexType = "primary" | "secondary"

/** Record of indices */
export type IndexRecord<T extends KvObject> = {
  [K in KeysOfThatExtend<T, KvValue | undefined>]?: IndexType
}

/** Keys of primary indices */
export type PrimaryIndexKeys<
  T1 extends KvValue,
  T2 extends CollectionOptions<T1>,
> = T2 extends { indices: IndexRecord<KvObject> }
  ? KeysOfThatExtend<T2["indices"], "primary">
  : never

/** Keys of secondary indices */
export type SecondaryIndexKeys<
  T1 extends KvValue,
  T2 extends CollectionOptions<T1>,
> = T2 extends { indices: IndexRecord<KvObject> }
  ? KeysOfThatExtend<T2["indices"], "secondary">
  : never

/** Indexed value entry */
export type IndexDataEntry<T extends KvObject> = Omit<T, "__id__"> & {
  __id__: KvId
}

/***********************/
/*                     */
/*   SERIALIZE TYPES   */
/*                     */
/***********************/

/** Record of serializer functions */
export type Serializer = {
  serialize: <T>(data: T) => Uint8Array
  deserialize: <T>(data: Uint8Array) => T
  compress: (data: Uint8Array) => Uint8Array
  decompress: (data: Uint8Array) => Uint8Array
}

/** Serialized value entry */
export type SerializedEntry = {
  isUint8Array: boolean
  ids: KvId[]
}

/**
 * Serialize options.
 *
 * "core" = unstable Deno core serializer. Only works on Deno (not on Deno Deploy).
 *
 * "json" = custom JSON serializer, works on every runtime.
 *
 * If custom serialize and decompress functions are set, "json" serializer is used by default for the functions that are not set.
 */
export type SerializeOptions = "core" | "json" | Partial<Serializer>

/***************************/
/*                         */
/*   METHOD OPTION TYPES   */
/*                         */
/***************************/

/** Options for setting new document entry */
export type SetOptions = NonNullable<Parameters<Deno.Kv["set"]>["2"]> & {
  /** Number of retry attempts before returning failed operation */
  retry?: number

  /**
   * Whether the operation should overwrite an existing document with the same id or not.
   *
   * @default false
   */
  overwrite?: boolean

  /**
   * Enable or disable atomic operation batching.
   *
   * This allows for storing larger sized data by writing in batched operations
   * as opposed to poling all mutations into a single atomic operation.
   *
   * @default false
   */
  batched?: boolean
}

/** Options for listing documents */
export type ListOptions<T> = Omit<Deno.KvListOptions, "limit"> & {
  /**
   * Filter result based on predicate.
   *
   * @param value - Input value.
   * @returns true or false.
   */
  filter?: (value: T) => boolean

  /**
   * Number of documents to offset by.
   *
   * If set, the underlying limit for the KV.list operation is set equal to offset + limit.
   */
  offset?: number

  /** Id of document to start from. */
  startId?: KvId

  /** Id of document to end at. */
  endId?: KvId

  /** Max number of documents that are read from the KV store. */
  limit?: number

  /** Max number of documents that are returned. Differs from "limit" by applying after documents are read from the KV store. */
  resultLimit?: number
}

/** Options for handling one listed document */
export type HandleOneOptions<T> = Omit<ListOptions<T>, "resultLimit">

/** Options for finding a single document */
export type FindOptions = NonNullable<Parameters<Deno.Kv["get"]>[1]>

/** Options for finding many documents */
export type FindManyOptions = NonNullable<Parameters<Deno.Kv["getMany"]>[1]>

/** Options for updating a single document */
export type UpdateOptions = Omit<SetOptions, "overwrite"> & {
  /**
   * Strategy to use when updating a value.
   *
   * For primtive types and built-in objects (Date, RegExp, etc.) "replace" strategy is always used.
   *
   * `merge-shallow` is only applicable for plain object types.
   *
   * @default "merge"
   */
  strategy?: UpdateStrategy

  /** Options to apply when deep-merging objects. */
  mergeOptions?: DeepMergeOptions
}

/**
 * Update strategy.
 *
 * "replace" overwrites the exisitng value with a new value,
 * "merge" deep-merges the existing value with a new value,
 * "merge-shallow" shallow-merges the existing value with a new value
 */
export type UpdateStrategy = "replace" | "merge" | "merge-shallow"

/** Options for updating many documents */
export type UpdateManyOptions<T> =
  & ListOptions<T>
  & UpdateOptions

/** Options for updating one listed document */
export type UpdateOneOptions<T> =
  & HandleOneOptions<T>
  & UpdateOptions

/** Options for counting all documents */
export type CountAllOptions = Pick<ListOptions<any>, "consistency">

/** Options for enqueing messages */
export type EnqueueOptions =
  & Omit<
    KvEnqueueOptions,
    "keysIfUndelivered"
  >
  & {
    /** List of ids to set the message value to if undelivered */
    idsIfUndelivered?: KvId[]

    /** Topic to queue the message in. Only listeners in the same topic will receive the message. */
    topic?: string
  }

/** Options for listening to queue messages  */
export type QueueListenerOptions = {
  /** Topic to listen to. Only messages enqueued in the same topic will be received. */
  topic?: string
}

/** Options for watching for live data updates */
export type WatchOptions = NonNullable<Parameters<Deno.Kv["watch"]>[1]>

/********************/
/*                  */
/*   UPSERT TYPES   */
/*                  */
/********************/

/** Upsert by id */
export type IdUpsert<
  TInput,
  TOutput extends KvValue,
  TStrategy extends UpdateStrategy | undefined,
> = {
  /** Document id to upsert by */
  id: KvId

  /** New value */
  set: ParseInputType<TInput, TOutput>

  /** Update value */
  update: UpdateData<TOutput, TStrategy>
}

/** Upsert by primary index */
export type PrimaryIndexUpsert<
  TInput,
  TOutput extends KvValue,
  TIndex,
  TStrategy extends UpdateStrategy | undefined,
> = {
  /** Id of document if new value is set */
  id?: KvId

  /** Document index to upsert by */
  index: [TIndex, CheckKeyOf<TIndex, TOutput>]

  /** New value */
  set: ParseInputType<TInput, TOutput>

  /** Update value */
  update: UpdateData<TOutput, TStrategy>
}

/********************/
/*                  */
/*   SCHEMA TYPES   */
/*                  */
/********************/

/** Schema definition, containing builder functions and nested schema definitions. */
export type SchemaDefinition = {
  [key: string]:
    | SchemaDefinition
    | BuilderFnAny
}

/** Built schema from schema definition */
export type Schema<T extends SchemaDefinition> = {
  [K in keyof T]: T[K] extends SchemaDefinition ? Schema<T[K]>
    : T[K] extends BuilderFnAny ? ReturnType<T[K]>
    : never
}

/*******************/
/*                 */
/*   QUEUE TYPES   */
/*                 */
/*******************/

/** Queue message contents */
export type QueueMessage<T extends KvValue> = {
  __is_undefined__: boolean
  __handlerId__: string
  __data__: T
}

/** Parsed queue message */
export type ParsedQueueMessage<T extends KvValue> = {
  ok: true
  msg: QueueMessage<T>
} | {
  ok: false
}

/** Queue message handler function */
export type QueueMessageHandler<T extends KvValue> = (data: T) => unknown

/** Prepared enqueue */
export type PreparedEnqueue<T extends KvValue> = {
  msg: QueueMessage<T>
  options: KvEnqueueOptions
}

/** Collection of queue handler functions */
export type QueueHandlers = Map<string, QueueMessageHandler<KvValue>[]>

/******************/
/*                */
/*   DATA TYPES   */
/*                */
/******************/

/** Type of update data based on output type and update strategy */
export type UpdateData<
  TOutput extends KvValue,
  TStrategy extends UpdateStrategy | undefined,
> = TStrategy extends "replace" ? TOutput : Partial<TOutput>

/** Flattened document data */
export type FlatDocumentData<T extends KvValue> =
  & Omit<DocumentData<T>, "value">
  & (
    T extends KvObject ? T : {
      readonly value: T
    }
  )

/** Document data */
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

/** Kv enqueue options */
export type KvEnqueueOptions = NonNullable<
  Parameters<Deno.Kv["enqueue"]>[1]
>

/** Type of versionstamp */
export type KvVersionstamp<T extends KvValue> = Deno.KvEntry<T>["versionstamp"]

/** An entry or collection key */
export type KvKey = [Deno.KvKeyPart, ...Deno.KvKey]

/** An entry ID */
export type KvId = Exclude<Deno.KvKeyPart, Exclude<Deno.KvKeyPart, KvValue>>

/** An object containing only KV values, and is itself a KV value. */
export type KvObject = {
  [K: string | number]: KvValue
}

/** An array containing only KV values, and is itself a KV value. */
export type KvArray = KvValue[]

/** Defines all valid KV value types */
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
