import type { Collection } from "./collection.ts";
import type { DeepMergeOptions } from "./deps.ts";
import type { Document } from "./document.ts";

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
  kv: DenoKv,
  key: KvKey,
  queueHandlers: QueueHandlers,
  idempotentListener: IdempotentListener,
) => Collection<TInput, TOutput, TOptions>;

/** Any collection builder function */
export type BuilderFnAny = (...args: any[]) => any;

/** An idempotent listener invoker */
export type IdempotentListener = () => Promise<void>;

/** Utility type for checking if K is a valid key of T */
export type CheckKeyOf<K, T> = K extends keyof T ? T[K] : never;

/** Utility type for selecting keys of object T1 that extend T2 */
export type KeysOfThatExtend<T1, T2> = keyof {
  [K in keyof T1 as T1[K] extends T2 ? K : never]: unknown;
};

/** Utility type for selecting keys of object T1 that do not extend T2 */
export type KeysOfThatDontExtend<T1, T2> = keyof {
  [K in keyof T1 as T1[K] extends T2 ? never : K]: unknown;
};

/** Successful commit result object */
export type CommitResult<T1 extends KvValue, T2 extends KvId> = {
  ok: true;
  versionstamp: Document<T1, T2>["versionstamp"];
  id: T2;
};

/** Many commit result object */
export type ManyCommitResult = {
  ok: true;
};

/** Pagination object containing last cursor */
export type Pagination = {
  cursor: string | undefined;
};

/** Pagination result object containing last cursor and result array */
export type PaginationResult<T> = Pagination & {
  result: T[];
};

/** Id generator function */
export type IdGenerator<T1 extends KvValue, T2 extends KvId> = (
  data: T1,
) => T2 | Promise<T2>;

/**********************/
/*                    */
/*   INTERVAL TYPES   */
/*                    */
/**********************/

/** Either static or dynamic interval value */
export type IntervalSetter =
  | number
  | ((msg: IntervalMessage) => number | Promise<number>);

/** Options for creating a new interval */
export type SetIntervalOptions = {
  /** Condition used to determine if the interval should continue running */
  while?: (msg: IntervalMessage) => boolean | Promise<boolean>;

  /** Task to be run when terminating the interval, executed after `while()` returns true. */
  onExit?: (msg: IntervalMessage) => unknown;

  /**
   * Delay before running the first task.
   *
   * If not set, will run the first task immediately.
   */
  startDelay?: number;

  /**
   * Number of retry attempts upon failed enqueue delivery.
   *
   * When all retry attempts are spent, the interval will terminate.
   *
   * @default 10
   */
  retry?: number;
};

/** Contents of interval megssage */
export type IntervalMessage = {
  /** Task number, starts at 0 for the first task. */
  count: number;

  /** Previously set interval. Equal to `startDelay` or 0 for the first task. */
  interval: number;

  /** Enqueue timestamp of current task. */
  timestamp: Date;

  /** True if the current task is the first callback, false if not. */
  first: boolean;
};

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
  delay?: number | ((msg: LoopMessage<T>) => number | Promise<number>);

  /** Condition used to determine if the loop should continue running */
  while?: (msg: LoopMessage<T>) => boolean | Promise<boolean>;

  /** Task to be run when terminating the loop, executed after `while()` returns true. */
  onExit?: (msg: LoopMessage<T>) => unknown;

  /**
   * Delay before running the first task.
   *
   * If not set, will run the first task immediately.
   */
  startDelay?: number;

  /**
   * Number of retry attempts upon failed enqueue delivery.
   *
   * When all retry attempts are spent, the loop will terminate.
   *
   * @default 10
   */
  retry?: number;
};

/** Contents of loop message */
export type LoopMessage<T> =
  & {
    /** Task number, starts at 0. */
    count: number;

    /** Previously set delay, is equal to `startDelay` or 0 for the first task. */
    delay: number;

    /** Enqueue timestamp of current task. */
    timestamp: Date;
  }
  & (
    | {
      /** Result of prevous task. Is null for the first task. */
      result: T;

      /** True if the current task is the first callback, false if not. */
      first: false;
    }
    | {
      /** Result of prevous task. Is null for the first task. */
      result: null;

      /** True if the current task is the first callback, false if not. */
      first: true;
    }
  );

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
  TOptions extends CollectionOptions<TOutput>,
> = (
  schema: TSchema,
) => Collection<TInput, TOutput, TOptions>;

/** Prepared value delete function */
export type PrepareDeleteFn = (kv: DenoKv) => Promise<PreparedIndexDelete>;

/** Prepared index delete function */
export type PreparedIndexDelete = {
  id: KvId;
  data: KvObject;
};

/** Atomic builder operations */
export type Operations = {
  atomic: DenoAtomicOperation;
  asyncMutations: Array<() => Promise<void>>;
  prepareDeleteFns: PrepareDeleteFn[];
  indexDeleteCollectionKeys: KvKey[];
  indexAddCollectionKeys: KvKey[];
};

/** Kvdex atomic check */
export type AtomicCheck<T1 extends KvValue, T2 extends KvId> = {
  /** Id of document to check */
  id: Document<T1, T2>["id"];

  /** Versionstamp of document to check */
  versionstamp: Document<T1, T2>["versionstamp"];
};

/** Atomic mutation object */
export type AtomicMutation<T1, T2 extends KvId> =
  & {
    id: T2;
  }
  & (
    | {
      type: "set";
      value: T1;
      expireIn?: number;
    }
    | {
      type: "add";
      value: T1;
      expireIn?: number;
    }
    | {
      type: "sum";
      value: T1 extends DenoKvU64 ? bigint : never;
    }
    | {
      type: "min";
      value: T1 extends DenoKvU64 ? bigint : never;
    }
    | {
      type: "max";
      value: T1 extends DenoKvU64 ? bigint : never;
    }
    | {
      type: "delete";
    }
  );

/** Options for atomic set operation */
export type AtomicSetOptions = NonNullable<
  Parameters<ReturnType<DenoKv["atomic"]>["set"]>["2"]
>;

/************************/
/*                      */
/*   COLLECTION TYPES   */
/*                      */
/************************/

/** Options for creating a new collection */
export type CollectionOptions<T extends KvValue> =
  & {
    idGenerator?: IdGenerator<T, KvId>;
    encoder?: Encoder;
    history?: true;
  }
  & (
    T extends KvObject ? {
        indices?: IndexRecord<T>;
      }
      : { [K in never]: never }
  );

export type ParseId<T extends CollectionOptions<any>> = T["idGenerator"] extends
  IdGenerator<any, any> ? Awaited<ReturnType<T["idGenerator"]>> : string;

/** Utility type for accessing all possible collection options */
export type PossibleCollectionOptions = CollectionOptions<
  Record<string, never>
>;

/** Record of all collection keys */
export type CollectionKeys = {
  base: KvKey;
  id: KvKey;
  primaryIndex: KvKey;
  secondaryIndex: KvKey;
  segment: KvKey;
  undelivered: KvKey;
  history: KvKey;
  historySegment: KvKey;
};

/**
 * Model describing the input and output type of data.
 * Contains a parse function, and optionally a `__validate()` function used instead of parse upon reading data.
 */
export type Model<TInput, TOutput extends KvValue> = {
  /** A parse function that takes data as an argument and returns the parsed output */
  parse(data: unknown): TOutput;

  /**
   * An optional transform function that takes an input value as argument and returns the output type.
   */
  _transform?(input: TInput): TOutput;

  /** Used to determine the input type */
  _input: TInput;
};

/** Historic write entry */
export type WriteHistoryEntry<T> = {
  type: "write";
  timestamp: Date;
  value: T;
};

/** Historic delete entry */
export type DeleteHistoryEntry = {
  type: "delete";
  timestamp: Date;
};

/** Historic document entry */
export type HistoryEntry<T> = WriteHistoryEntry<T> | DeleteHistoryEntry;

/*******************/
/*                 */
/*   INDEX TYPES   */
/*                 */
/*******************/

/** Type of index. "primary" is unique, while "secondary" is non-unique. */
export type IndexType = "primary" | "secondary";

/** Record of indices */
export type IndexRecord<T extends KvObject> = {
  [K in KeysOfThatExtend<T, KvValue | undefined>]?: IndexType;
};

/** Keys of primary indices */
export type PrimaryIndexKeys<
  T1 extends KvValue,
  T2 extends CollectionOptions<T1>,
> = T2 extends { indices: IndexRecord<KvObject> }
  ? KeysOfThatExtend<T2["indices"], "primary">
  : never;

/** Keys of secondary indices */
export type SecondaryIndexKeys<
  T1 extends KvValue,
  T2 extends CollectionOptions<T1>,
> = T2 extends { indices: IndexRecord<KvObject> }
  ? KeysOfThatExtend<T2["indices"], "secondary">
  : never;

/** Indexed value entry */
export type IndexDataEntry<T extends KvObject> = Omit<T, "__id__"> & {
  __id__: KvId;
};

/**********************/
/*                    */
/*   ENCODING TYPES   */
/*                    */
/**********************/

/**
 * Object containing logic for serialization and compression of KvValues.
 *
 * Implements a serializer, and optionally a compressor.
 */
export type Encoder = {
  serializer: Serializer;
  compressor?: Compressor;
};

/** Object that implements a serilize and deserilaize method */
export type Serializer = {
  serialize: SerializeFn;
  deserialize: DeserializeFn;
};

/** Object that implements a compress and decompress method */
export type Compressor = {
  compress: CompressFn;
  decompress: CompressFn;
};

/** Function that serializes a KvValue as a Uint8Array */
export type SerializeFn = (data: unknown) => Uint8Array | Promise<Uint8Array>;

/** Function that deserializes a KvValue from a Uint8Array */
export type DeserializeFn = <T>(
  data: Uint8Array,
) => T | Promise<T>;

/** Function that compresses/decompresses data represented by a Uint8Array */
export type CompressFn = (data: Uint8Array) => Uint8Array | Promise<Uint8Array>;

/** Encoded value entry */
export type EncodedEntry = {
  isUint8Array: boolean;
  ids: KvId[];
};

/***************************/
/*                         */
/*   METHOD OPTION TYPES   */
/*                         */
/***************************/

/** Options for setting new document entry */
export type SetOptions = NonNullable<Parameters<DenoKv["set"]>["2"]> & {
  /** Number of retry attempts before returning failed operation */
  retry?: number;

  /**
   * Whether the operation should overwrite an existing document with the same id or not.
   *
   * @default false
   */
  overwrite?: boolean;

  /**
   * Enable or disable atomic operation batching.
   *
   * This allows for storing larger sized data by writing using batched operations
   * as opposed to pooling all mutations into a single atomic operation.
   *
   * @default false
   */
  batched?: boolean;
};

/** Options for listing documents */
export type ListOptions<T1, T2 extends KvId> =
  & Omit<DenoKvListOptions, "limit">
  & {
    /**
     * Filter result based on predicate.
     *
     * @param value - Input value.
     * @returns true or false.
     */
    filter?: (value: T1) => boolean;

    /**
     * Number of documents to offset by.
     *
     * If set, the underlying limit for the KV.list operation is set equal to offset + limit.
     */
    offset?: number;

    /** Id of document to start from. */
    startId?: T2;

    /** Id of document to end at. */
    endId?: T2;

    /** Max number of documents that are read from the KV store. Applies before before filtering. */
    limit?: number;

    /** Max number of documents that are returned. Differs from "limit" by applying after documents are read from the KV store and filtered. */
    take?: number;
  };

/** Options for handling one listed document */
export type HandleOneOptions<T1, T2 extends KvId> = Omit<
  ListOptions<T1, T2>,
  "take"
>;

/** Options for finding a single document */
export type FindOptions = NonNullable<Parameters<DenoKv["get"]>[1]>;

/** Options for finding many documents */
export type FindManyOptions = NonNullable<Parameters<DenoKv["getMany"]>[1]>;

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
  strategy?: UpdateStrategy;

  /** Options to apply when deep-merging objects. */
  mergeOptions?: DeepMergeOptions;
};

/**
 * Update strategy.
 *
 * "replace" overwrites the exisitng value with a new value,
 * "merge" deep-merges the existing value with a new value,
 * "merge-shallow" shallow-merges the existing value with a new value
 */
export type UpdateStrategy = "replace" | "merge" | "merge-shallow";

/** Options for updating many documents */
export type UpdateManyOptions<T1, T2 extends KvId> =
  & ListOptions<T1, T2>
  & UpdateOptions;

/** Options for updating one listed document */
export type UpdateOneOptions<T1, T2 extends KvId> =
  & HandleOneOptions<T1, T2>
  & UpdateOptions;

/** Options for counting all documents */
export type CountAllOptions = Pick<ListOptions<any, KvId>, "consistency">;

/** Options for enqueing messages */
export type EnqueueOptions =
  & Omit<
    KvEnqueueOptions,
    "keysIfUndelivered"
  >
  & {
    /** List of ids to set the message value to if undelivered */
    idsIfUndelivered?: KvId[];

    /** Topic to queue the message in. Only listeners in the same topic will receive the message. */
    topic?: string;
  };

/** Options for listening to queue messages  */
export type QueueListenerOptions = {
  /** Topic to listen to. Only messages enqueued in the same topic will be received. */
  topic?: string;
};

/** Options for watching for live data updates */
export type WatchOptions = NonNullable<Parameters<DenoKv["watch"]>[1]>;

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
  TId extends KvId,
> = {
  /** Document id to upsert by */
  id: TId;

  /** New value */
  set: TInput;

  /** Update value */
  update: UpdateData<TOutput, TStrategy>;
};

/** Upsert by primary index */
export type PrimaryIndexUpsert<
  TInput,
  TOutput extends KvValue,
  TIndex,
  TStrategy extends UpdateStrategy | undefined,
  TId extends KvId,
> = {
  /** Id of document if new value is set */
  id?: TId;

  /** Document index to upsert by */
  index: [TIndex, CheckKeyOf<TIndex, TOutput>];

  /** New value */
  set: TInput;

  /** Update value */
  update: UpdateData<TOutput, TStrategy>;
};

/********************/
/*                  */
/*   SCHEMA TYPES   */
/*                  */
/********************/

/** Schema definition, containing builder functions and nested schema definitions. */
export type SchemaDefinition = {
  [key: string]:
    | SchemaDefinition
    | BuilderFnAny;
};

/** Built schema from schema definition */
export type Schema<T extends SchemaDefinition> = {
  [K in keyof T]: T[K] extends SchemaDefinition ? Schema<T[K]>
    : T[K] extends BuilderFnAny ? ReturnType<T[K]>
    : never;
};

/*******************/
/*                 */
/*   QUEUE TYPES   */
/*                 */
/*******************/

/** Queue message contents */
export type QueueMessage<T extends KvValue> = {
  __is_undefined__: boolean;
  __handlerId__: string;
  __data__: T;
};

/** Parsed queue message */
export type ParsedQueueMessage<T extends KvValue> = {
  ok: true;
  msg: QueueMessage<T>;
} | {
  ok: false;
};

/** Queue message handler function */
export type QueueMessageHandler<T extends KvValue> = (data: T) => unknown;

/** Prepared enqueue */
export type PreparedEnqueue<T extends KvValue> = {
  msg: QueueMessage<T>;
  options: KvEnqueueOptions;
};

/** Collection of queue handler functions */
export type QueueHandlers = Map<string, QueueMessageHandler<KvValue>[]>;

/******************/
/*                */
/*   DATA TYPES   */
/*                */
/******************/

/** Type of update data based on output type and update strategy */
export type UpdateData<
  TOutput extends KvValue,
  TStrategy extends UpdateStrategy | undefined,
> = TStrategy extends "replace" ? TOutput : Partial<TOutput>;

/** Flattened document data */
export type FlatDocumentData<T1 extends KvValue, T2 extends KvId> =
  & Omit<DocumentData<T1, T2>, "value">
  & (
    T1 extends KvObject ? T1 : {
      readonly value: T1;
    }
  );

/** Document data */
export type DocumentData<T1, T2 extends KvId> = {
  readonly id: T2;
  readonly versionstamp: string;
  readonly value: T1;
};

/****************/
/*              */
/*   KV TYPES   */
/*              */
/****************/

/** Kv enqueue options */
export type KvEnqueueOptions = NonNullable<
  Parameters<DenoKv["enqueue"]>[1]
>;

/** An entry or collection key */
export type KvKey = [DenoKvStrictKeyPart, ...DenoKvStrictKey];

/** An entry ID */
export type KvId = DenoKvStrictKeyPart;

/** An object containing only KV values, and is itself a KV value. */
export type KvObject = {
  [K: string | number]: KvValue;
};

/** An array containing only KV values, and is itself a KV value. */
export type KvArray = KvValue[];

/** Defines all valid KV value types */
export type KvValue =
  | undefined
  | null
  | string
  | number
  | boolean
  | bigint
  | DenoKvU64
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
  | Float16Array
  | Float32Array
  | Float64Array
  | ArrayBuffer
  | Date
  | Set<KvValue>
  | Map<KvValue, KvValue>
  | RegExp
  | DataView
  | Error;

/********************/
/*                  */
/*  DenoKV TYPES    */
/*                  */
/********************/

/** Deno [KvKeyPart](https://deno.land/api?s=Deno.KvKeyPart&unstable=) (strict) substitute type */
export type DenoKvStrictKeyPart =
  | boolean
  | string
  | number
  | bigint
  | Uint8Array;

/** Deno [KvKeyPart](https://deno.land/api?s=Deno.KvKeyPart&unstable=) (relaxed) substitute type */
export type DenoKvLaxKeyPart = DenoKvStrictKeyPart | symbol;

/** Deno [KvKey](https://deno.land/api?s=Deno.KvKey&unstable=) (strict) substitute type */
export type DenoKvStrictKey = DenoKvStrictKeyPart[];

/** Deno [KvKey](https://deno.land/api?s=Deno.KvKey&unstable=) (relaxed) substitute type */
export type DenoKvLaxKey = DenoKvLaxKeyPart[];

/** Deno [KvU64](https://deno.land/api?s=Deno.KvU64&unstable=) substitute type */
export type DenoKvU64 = {
  /** The value of this unsigned 64-bit integer, represented as a bigint.  */
  value: bigint;
};

/** Deno [KvCommitError](https://deno.land/api?s=Deno.KvCommitError&unstable=) substitute type */
export type DenoKvCommitError = {
  ok: false;
};

/** Deno [KvCommitResult](https://deno.land/api?s=Deno.KvCommitResult&unstable=) substitute type */
export type DenoKvCommitResult = {
  ok: true;

  /** The versionstamp of the value committed to KV. */
  versionstamp: string;
};

/** Deno [AtomicCheck](https://deno.land/api?s=Deno.AtomicCheck&unstable=) substitute type */
export type DenoAtomicCheck = {
  key: DenoKvStrictKey;
  versionstamp: string | null;
};

/** Deno [KvEnqueueOptions](https://deno.land/api?s=Deno.Kv&unstable=&p=prototype.enqueue) substitute type */
export type DenoKvEnqueueOptions = {
  /**
   * The delay option can be used to specify the delay (in milliseconds) of the value delivery.
   * The default delay is 0, which means immediate delivery.
   *
   * @default 0
   */
  delay?: number;

  /**
   * Can be used to specify the keys to be set if the value is not successfully delivered to the queue listener after several attempts.
   * The values are set to the value of the queued message.
   */
  keysIfUndelivered?: DenoKvStrictKey[];

  /**
   * Can be used to specify the retry policy for failed message delivery.
   * Each element in the array represents the number of milliseconds to wait before retrying the delivery.
   * For example, [1000, 5000, 10000] means that a failed delivery will be retried at most 3 times, with 1 second, 5 seconds, and 10 seconds delay between each retry.
   */
  backoffSchedule?: number[];
};

/** Deno [KvEntry](https://deno.land/api?s=Deno.KvEntry&unstable=) substitute type */
export type DenoKvEntry = {
  key: Readonly<DenoKvLaxKey>;
  value: unknown;
  versionstamp: string;
};

/** Deno [KvEntryNull](https://deno.land/api?s=Deno.KvEntryMaybe&unstable=) substitute type */
export type DenoKvEntryNull = {
  key: Readonly<DenoKvLaxKey>;
  value: null;
  versionstamp: null;
};

/** Deno [KvEntryMaybe](https://deno.land/api?s=Deno.KvEntryMaybe&unstable=) substitute type */
export type DenoKvEntryMaybe = DenoKvEntry | DenoKvEntryNull;

/** Deno [KvConsistencyLevel](https://deno.land/api?s=Deno.KvConsistencyLevel&unstable=) substitute type */
export type DenoKvConsistencyLevel = "strong" | "eventual";

/** Deno [KvGetOptions](https://deno.land/api?s=Deno.Kv&unstable=&p=prototype.get) substitute type */
export type DenoKvGetOptions = {
  /**
   * The consistency option can be used to specify the consistency level for the read operation.
   * The default consistency level is "strong". Some use cases can benefit from using a weaker consistency level.
   * For more information on consistency levels, see the documentation for [Deno.KvConsistencyLevel](https://deno.land/api?s=Deno.KvConsistencyLevel&unstable=).
   *
   * @default "strong"
   */
  consistency?: DenoKvConsistencyLevel;
};

/** Deno [KvSetOptions](https://deno.land/api?s=Deno.Kv&unstable=&p=prototype.set) substitute type */
export type DenoKvSetOptions = {
  /**
   * Optionally set a time-to-live (TTL) for the key.
   * The TTL is specified in milliseconds, and the key will be deleted from the database at earliest after the specified number of milliseconds have elapsed.
   * Once the specified duration has passed, the key may still be visible for some additional time.
   * If the expireIn option is not specified, the key will not expire.
   */
  expireIn?: number;
};

/** Deno [KvWatchOptions](https://deno.land/api?s=Deno.Kv&unstable=&p=prototype.watch) substitute type */
export type DenoKvWatchOptions = {
  /**
   * Specify whether a new value should be emitted whenever a mutation occurs on any of the watched keys
   * (even if the value of the key does not change, such as deleting a deleted key),
   * or only when entries have observably changed in some way.
   * When `raw: true` is used, it is possible for the stream to occasionally emit values even if no mutations have occurred on any of the watched keys.
   * The default value for this option is `false`.
   *
   * @default false
   */
  raw?: boolean;
};

/** Deno [KvListSelector](https://deno.land/api?s=Deno.KvListSelector&unstable=) substitute type */
export type DenoKvListSelector =
  | { prefix: DenoKvStrictKey }
  | { prefix: DenoKvStrictKey; start: DenoKvStrictKey }
  | { prefix: DenoKvStrictKey; end: DenoKvStrictKey }
  | { start: DenoKvStrictKey; end: DenoKvStrictKey };

/** Deno [KvListOptions](https://deno.land/api?s=Deno.KvListOptions&unstable=) substitute type */
export type DenoKvListOptions = {
  /** The maximum number of values to return from the database. If not specified, all matching values will be returned. */
  limit?: number;

  /** The cursor to resume the iteration from. If not specified, the iteration will start from the beginning. */
  cursor?: string;

  /**
   * Whether to reverse the order of the returned values.
   * If not specified, the order will be ascending from the start of the range as per the lexicographical ordering of the keys.
   * If true, the order will be descending from the end of the range.
   *
   * @default false
   */
  reverse?: boolean;

  /**
   * The consistency level of the list operation.
   * The default consistency level is "strong".
   * Some use cases can benefit from using a weaker consistency level.
   * For more information on consistency levels, see the documentation for [Deno.KvConsistencyLevel](https://deno.land/api?s=Deno.KvConsistencyLevel&unstable=).
   *
   * List operations are performed in batches (in sizes specified by the `batchSize` option).
   * The consistency level of the list operation is applied to each batch individually.
   * This means that while each batch is guaranteed to be consistent within itself,
   * the entire list operation may not be consistent across batches because a mutation may be applied to a key-value pair between batches,
   * in a batch that has already been returned by the list operation.
   *
   * @default "strong"
   */
  consistency?: DenoKvConsistencyLevel;

  /**
   * The size of the batches in which the list operation is performed.
   * Larger or smaller batch sizes may positively or negatively affect the performance of a list operation depending on the specific use case and iteration behavior.
   * Slow iterating queries may benefit from using a smaller batch size for increased overall consistency,
   * while fast iterating queries may benefit from using a larger batch size for better performance.
   *
   * The default batch size is equal to the limit option, or 100 if this is unset.
   * The maximum value for this option is 500. Larger values will be clamped.
   */
  batchSize?: number;
};

/** Deno [KVListIterator](https://deno.land/api?s=Deno.KvListIterator&unstable=) substitute type */
export type DenoKvListIterator =
  & (
    | AsyncIterableIterator<DenoKvEntryMaybe>
    | IterableIterator<DenoKvEntryMaybe>
  )
  & {
    /**
     * Cursor of the current position in the iteration.
     * This cursor can be used to resume iteration from the current position in the future
     * by passing it to any of the list operations (e.g. `getMany()`, `map()`, `forEach()` etc).
     */
    cursor: string;
  };

/** Deno [AtomicOperation](deno.land/api?s=Deno.AtomicOperation&unstable=) substitute type */
export type DenoAtomicOperation = {
  set(
    key: DenoKvStrictKey,
    value: unknown,
    options?: DenoKvSetOptions,
  ): DenoAtomicOperation;

  delete(key: DenoKvStrictKey): DenoAtomicOperation;

  min(key: DenoKvStrictKey, n: bigint): DenoAtomicOperation;

  max(key: DenoKvStrictKey, n: bigint): DenoAtomicOperation;

  sum(key: DenoKvStrictKey, n: bigint): DenoAtomicOperation;

  check(...checks: DenoAtomicCheck[]): DenoAtomicOperation;

  enqueue(value: unknown, options?: DenoKvEnqueueOptions): DenoAtomicOperation;

  commit():
    | Promise<DenoKvCommitError | DenoKvCommitResult>
    | DenoKvCommitError
    | DenoKvCommitResult;
};

/** Deno [KV](https://deno.land/api?s=Deno.Kv&unstable=) substitute type */
export type DenoKv = {
  atomic(): DenoAtomicOperation;

  close(): void;

  delete(key: DenoKvStrictKey): Promise<void> | void;

  enqueue(
    value: unknown,
    options?: DenoKvEnqueueOptions,
  ): Promise<DenoKvCommitResult> | DenoKvCommitResult;

  get(
    key: DenoKvStrictKey,
    options?: DenoKvGetOptions,
  ): Promise<DenoKvEntryMaybe> | DenoKvEntryMaybe;

  getMany(
    keys: DenoKvStrictKey[],
    options?: DenoKvGetOptions,
  ): Promise<DenoKvEntryMaybe[]> | DenoKvEntryMaybe[];

  list(
    selector: DenoKvListSelector,
    options?: DenoKvListOptions,
  ): DenoKvListIterator;

  listenQueue(handler: (value: unknown) => unknown): Promise<void>;

  set(
    key: DenoKvStrictKey,
    value: unknown,
    options?: DenoKvSetOptions,
  ):
    | Promise<DenoKvCommitError | DenoKvCommitResult>
    | DenoKvCommitError
    | DenoKvCommitResult;

  watch(
    keys: DenoKvStrictKey[],
    options?: DenoKvWatchOptions,
  ): ReadableStream<DenoKvEntryMaybe[]>;
};
