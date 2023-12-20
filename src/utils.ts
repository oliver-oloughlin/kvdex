import { COMPRESSION_QUALITY_LEVEL, GET_MANY_KEY_LIMIT } from "./constants.ts"
import type { Collection } from "./collection.ts"
import type {
  AtomicSetOptions,
  DenoCore,
  EnqueueOptions,
  FindManyOptions,
  IndexDataEntry,
  KvId,
  KvKey,
  KvObject,
  KvValue,
  ListOptions,
  ParsedQueueMessage,
  PreparedEnqueue,
  QueueMessage,
} from "./types.ts"
import {
  brotliCompressSync,
  brotliDecompressSync,
  constants,
  ulid,
} from "./deps.ts"

/*************************/
/*                       */
/*   PUBLIC FUNCTIONS    */
/*                       */
/*************************/

/**
 * Generate a new document id.
 *
 * @returns A generated id of type KvId.
 */
export function generateId() {
  return ulid()
}

/**
 * Extend a kv key with key parts.
 *
 * @param key - The input key to be extended.
 * @param keyParts - Key parts to add to the input key.
 * @returns An extended kv key.
 */
export function extendKey(key: KvKey, ...keyParts: KvKey) {
  return [...key, ...keyParts] as KvKey
}

/**
 * Get a document id from a document key.
 *
 * @param key - A document key.
 * @returns A document id, or undefined if key is empty.
 */
export function getDocumentId(key: Deno.KvKey) {
  return key.at(-1)
}

/**
 * Compare two kv keys for equality.
 *
 * @param k1 - First kv key.
 * @param k2 - Second kv key.
 * @returns true if keys are equal, false if not.
 */
export function keyEq(k1: KvKey, k2: KvKey) {
  return JSON.stringify(k1) === JSON.stringify(k2)
}

/**
 * Determine whether a kv value is an instance of KvObject.
 *
 * @param value - A value of type KvValue.
 * @returns true if the value is an instance of KvObject, false if not.
 */
export function isKvObject(value: unknown) {
  // If value is null or undefined, return false
  if (value === null || value === undefined) {
    return false
  }

  // If value is not an object, return false
  if (typeof value !== "object") {
    return false
  }

  // If value is an instance of other KvValue objects, return false
  if (
    value instanceof Deno.KvU64 ||
    value instanceof Array ||
    value instanceof Int8Array ||
    value instanceof Int16Array ||
    value instanceof Int32Array ||
    value instanceof BigInt64Array ||
    value instanceof Uint8Array ||
    value instanceof Uint16Array ||
    value instanceof Uint32Array ||
    value instanceof BigUint64Array ||
    value instanceof Uint8ClampedArray ||
    value instanceof Float32Array ||
    value instanceof Float64Array ||
    value instanceof ArrayBuffer ||
    value instanceof Date ||
    value instanceof Set ||
    value instanceof Map ||
    value instanceof RegExp ||
    value instanceof DataView ||
    value instanceof Error
  ) {
    return false
  }

  // Return true after performing all checks
  return true
}

/**
 * Set document indices using an atomic operation.
 *
 * @param id - Document id.
 * @param data - Document value.
 * @param atomic - An initialized atomic operation.
 * @param collection - The collection context.
 * @param options - Set options or undefined.
 * @returns The atomic operation with added mutations.
 */
export function setIndices(
  id: KvId,
  data: KvObject,
  value: KvObject,
  atomic: Deno.AtomicOperation,
  collection: Collection<any, any, any>,
  options: AtomicSetOptions | undefined,
) {
  // Set primary indices using primary index list
  collection._primaryIndexList.forEach((index) => {
    // Get the index value from data, if undefined continue to next index
    const indexValue = data[index] as KvId | undefined
    if (typeof indexValue === "undefined") return

    // Serialize and compress
    const serialized = collection._serializer.serialize(indexValue)
    const compressed = collection._serializer.compress(serialized)

    // Create the index key
    const indexKey = extendKey(
      collection._keys.primaryIndex,
      index,
      compressed,
    )

    // Create the index document value
    const indexEntry: IndexDataEntry<KvObject> = {
      ...value,
      __id__: id,
    }

    // Add index insertion to atomic operation, check for exisitng indices
    atomic.set(indexKey, indexEntry, options).check({
      key: indexKey,
      versionstamp: null,
    })
  })

  // Set secondary indices using secondary index list
  collection._secondaryIndexList.forEach((index) => {
    // Get the index value from data, if undefined continue to next index
    const indexValue = data[index] as KvId | undefined
    if (typeof indexValue === "undefined") return

    // Serialize and compress
    const serialized = collection._serializer.serialize(indexValue)
    const compressed = collection._serializer.compress(serialized)

    // Create the index key
    const indexKey = extendKey(
      collection._keys.secondaryIndex,
      index,
      compressed,
      id,
    )

    // Add index insertion to atomic operation, check for exisitng indices
    atomic.set(indexKey, value, options)
  })

  // Return the mutated atomic operation
  return atomic
}

/**
 * Check for index collisions when inserting update data.
 *
 * @param data - Update data.
 * @param atomic - Atomic operation.
 * @param collection - Collection context.
 * @returns The atomic operation with added checks.
 */
export function checkIndices(
  data: KvObject,
  atomic: Deno.AtomicOperation,
  collection: Collection<any, any, any>,
) {
  // Check primary indices using primary index list
  collection._primaryIndexList.forEach((index) => {
    // Get the index value from data, if undefined continue to next index
    const indexValue = data[index] as KvId | undefined
    if (typeof indexValue === "undefined") {
      return
    }

    // Serialize and compress
    const serialized = collection._serializer.serialize(indexValue)
    const compressed = collection._serializer.compress(serialized)

    // Create the index key
    const indexKey = extendKey(
      collection._keys.primaryIndex,
      index,
      compressed,
    )

    // Check for existing index entry
    atomic.check({
      key: indexKey,
      versionstamp: null,
    })
  })

  // Return the mutated atomic operation
  return atomic
}

/**
 * Delete document indices using an atomic operation.
 *
 * @param id - Document id.
 * @param data - Document value.
 * @param atomic - An initialized atomic operation.
 * @param collection - The collection context.
 * @returns The atomic operation with added mutations.
 */
export function deleteIndices(
  id: KvId,
  data: KvObject,
  atomic: Deno.AtomicOperation,
  collection: Collection<any, any, any>,
) {
  // Delete primary indices using primary index list
  collection._primaryIndexList.forEach((index) => {
    // Get the index value from data, if undefined continue to next index
    const indexValue = data[index] as KvId | undefined
    if (typeof indexValue === "undefined") return

    // Serialize and compress
    const serialized = collection._serializer.serialize(indexValue)
    const compressed = collection._serializer.compress(serialized)

    // Create the index key
    const indexKey = extendKey(
      collection._keys.primaryIndex,
      index,
      compressed,
    )

    // Add index deletion to atomic operation
    atomic.delete(indexKey)
  })

  // Delete seocndary indices using secondary index list
  collection._secondaryIndexList.forEach((index) => {
    // Get the index value from data, if undefined continue to next index
    const indexValue = data[index] as KvId | undefined
    if (typeof indexValue === "undefined") return

    // Serialize and compress
    const serialized = collection._serializer.serialize(indexValue)
    const compressed = collection._serializer.compress(serialized)

    // Create the index key
    const indexKey = extendKey(
      collection._keys.secondaryIndex,
      index,
      compressed,
      id,
    )

    // Add index deletion to atomic operation
    atomic.delete(indexKey)
  })

  // Return the mutated atomic operation
  return atomic
}

/**
 * Perform kv.getMany with sliced executions to allow for more keys than internal limit.
 *
 * @param keys - List of keys.
 * @param kv - Deno KV instance.
 * @param options - Find many options.
 * @returns List of entries.
 */
export async function kvGetMany<const T>(
  keys: Deno.KvKey[],
  kv: Deno.Kv,
  options?: FindManyOptions,
) {
  // Initialize sliced keys list
  const slicedKeys: Deno.KvKey[][] = []

  // Slice keys based on getMany keys limit
  for (let i = 0; i < keys.length; i += GET_MANY_KEY_LIMIT) {
    slicedKeys.push(keys.slice(i, i + GET_MANY_KEY_LIMIT))
  }

  // Execute getMany for each sliced keys entry
  const slicedEntries = await allFulfilled(slicedKeys.map((keys) => {
    return kv.getMany<T[]>(keys, options)
  }))

  // Return accumulated result
  return slicedEntries.flat()
}

/**
 * Get a list of result values from a list of promises.
 * Only returns the values of fulfilled promises.
 *
 * @param promises - List of promises.
 * @returns Result values from fulfilled promises.
 */
export async function allFulfilled<const T>(
  values: T[],
) {
  // Get settled results
  const settled = await Promise.allSettled(values)

  // Return fulfilled values
  return settled.reduce(
    (acc, result) =>
      result.status === "fulfilled" ? [...acc, result.value] : acc,
    [] as Awaited<T>[],
  )
}

/**
 * Prepare the queue message and options for an enqueue operation.
 *
 * @param key - Collection key or null for database enqueue
 * @param data - Queue message data
 * @param options - Enqueue options
 * @returns Prepared enqueue
 */
export function prepareEnqueue<const T extends KvValue>(
  baseKey: KvKey,
  undeliveredKey: KvKey,
  data: T,
  options: EnqueueOptions | undefined,
): PreparedEnqueue<T> {
  // Create queue message
  const msg: QueueMessage<T> = {
    __is_undefined__: data === undefined,
    __data__: data,
    __handlerId__: createHandlerId(baseKey, options?.topic),
  }

  // Create keys if undelivered
  const keysIfUndelivered = options?.idsIfUndelivered?.map((id) =>
    extendKey(undeliveredKey, id)
  )

  // Return prepared enqueue
  return {
    msg,
    options: {
      ...options,
      keysIfUndelivered,
    },
  }
}

/**
 * Create a handler id from a key and topic.
 *
 * @param key - Kv key.
 * @param topic - Queue topic.
 * @returns A handler id.
 */
export function createHandlerId(
  key: KvKey,
  topic: string | undefined,
) {
  return `${JSON.stringify(key)}${topic ?? ""}`
}

/**
 * Parse incoming queue message.
 *
 * @param msg - Queue message.
 * @returns Parsed queue message.
 */
export function parseQueueMessage<T extends KvValue>(
  msg: unknown,
): ParsedQueueMessage<T> {
  // Check for no message
  if (!msg) {
    return {
      ok: false,
    }
  }

  // Cast message as QueueMessage
  const _msg = msg as QueueMessage<T>

  // Check correctness of message parts
  if (
    !_msg.__handlerId__ ||
    (_msg.__data__ === undefined && !_msg.__is_undefined__)
  ) {
    return {
      ok: false,
    }
  }

  // Return parsed queue message
  return {
    ok: true,
    msg: _msg,
  }
}

/**
 * Create a list selector from a prefix key and list options.
 *
 * @param prefixKey - Key prefix.
 * @param options - List options.
 * @returns A list selector.
 */
export function createListSelector<T>(
  prefixKey: KvKey,
  options: ListOptions<T> | undefined,
): Deno.KvListSelector {
  // Create start key
  const start = typeof options?.startId !== "undefined"
    ? [...prefixKey, options.startId!]
    : undefined

  // Create end key
  const end = typeof options?.endId !== "undefined"
    ? [...prefixKey, options.endId!]
    : undefined

  // Conditionally set prefix key
  const prefix = Array.isArray(start) && Array.isArray(end)
    ? undefined!
    : prefixKey

  // Return list selector
  return {
    prefix,
    start,
    end,
  }
}

export function createListOptions<T>(options: ListOptions<T> | undefined) {
  const limit = options?.limit && options.limit + (options.offset ?? 0)
  return {
    ...options,
    limit,
  }
}

/**
 *  Checks whether the specified list options selects all entries or potentially limits the selection.
 *
 * @param options - List options.
 * @returns true if list options selects all entries, false if potentially not.
 */
export function selectsAll<T>(
  options: ListOptions<T> | undefined,
) {
  return (
    !options?.consistency &&
    !options?.cursor &&
    !options?.endId &&
    !options?.startId &&
    !options?.filter &&
    !options?.limit &&
    !options?.offset
  )
}

/**
 * Clamp a number between a lower and upper limit.
 *
 * @param min - Lower limit.
 * @param n - Number to be clamped.
 * @param max - Upper limit.
 * @returns A clamped value.
 */
export function clamp(min: number, n: number, max: number) {
  return Math.min(Math.max(min, n), max)
}

/**
 * Compress a uint8Array.
 *
 * @param data - Uint8Array to be compressed.
 * @returns Compressed Uint8Array.
 */
export function compress(data: Uint8Array) {
  const buffer = brotliCompressSync(data, {
    params: { [constants.BROTLI_PARAM_QUALITY]: COMPRESSION_QUALITY_LEVEL },
  })

  return new Uint8Array(buffer)
}

/**
 * Decompress a Uint8Array.
 *
 * @param data - Uint8Array to be decompressed.
 * @returns Decompressed Uint8Array.
 */
export function decompress(data: Uint8Array) {
  const buffer = brotliDecompressSync(data, {
    params: { [constants.BROTLI_PARAM_QUALITY]: COMPRESSION_QUALITY_LEVEL },
  })

  return new Uint8Array(buffer)
}

// @ts-ignore ?
const DENO_CORE: DenoCore = Deno[Deno.internal].core

export function denoCoreSerialize(data: unknown) {
  return DENO_CORE.serialize(beforeSerialize(data))
}

export function denoCoreDeserialize<T>(
  serialized: Uint8Array,
) {
  return afterDeserialize(DENO_CORE.deserialize(serialized)) as T
}

const KVU64_KEY = "__kvu64__"

export function beforeSerialize(value: unknown): unknown {
  if (value instanceof Deno.KvU64) {
    return { [KVU64_KEY]: value.value }
  }

  if (Array.isArray(value)) {
    return value.map((val) => beforeSerialize(val))
  }

  if (isKvObject(value)) {
    return Object.fromEntries(
      Object.entries(value as KvObject).map((
        [key, val],
      ) => [key, beforeSerialize(val)]),
    )
  }

  return value
}

export function afterDeserialize(value: unknown): unknown {
  if (isKvObject(value)) {
    const val = value as KvObject

    if (KVU64_KEY in val) {
      return new Deno.KvU64(val[KVU64_KEY] as bigint)
    }

    return Object.fromEntries(
      Object.entries(val).map(([k, v]) => [k, afterDeserialize(v)]),
    )
  }

  if (Array.isArray(value)) {
    return value.map((v) => afterDeserialize(v))
  }

  return value
}

export function isDeployRuntime() {
  return Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined
}

type JSONError = {
  message: string
  name: string
  cause?: unknown
  stack?: string
}

enum TypeKey {
  Undefined = "__undefined__",
  BigInt = "__bigint__",
  KvU64 = "__kvu64__",
  Int8Array = "__int8array__",
  Int16Array = "__int16array__",
  Int32Array = "__int32array__",
  BigInt64Array = "__bigint64array__",
  Uint8Array = "__uint8array__",
  Uint16Array = "__uint16array__",
  Uint32Array = "__uint32array__",
  BigUint64Array = "__biguint64array__",
  Uint8ClampedArray = "__uint8clampedarray__",
  Float32Array = "__float32array__",
  Float64Array = "__float64array__",
  ArrayBuffer = "__arraybuffer__",
  Date = "__date__",
  Set = "__set__",
  Map = "__map__",
  RegExp = "__regexp__",
  DataView = "__dataview__",
  Error = "__error__",
  NaN = "__nan__",
}

/**
 * Serialize a value to Uint8Array.
 *
 * @param value . Value to be serialized.
 * @returns Serialized value.
 */
export function jsonSerialize(value: unknown) {
  const str = stringify(value)
  return new TextEncoder().encode(str)
}

/**
 * Deserialize a value encoded as Uint8Array.
 *
 * @param value - Value to be deserialize.
 * @returns Deserialized value.
 */
export function jsonDeserialize<T>(value: Uint8Array) {
  const str = new TextDecoder().decode(value)
  return parse<T>(str)
}

function stringify(value: unknown, space?: number | string) {
  return JSON.stringify(_replacer(value), replacer, space)
}

function parse<T>(value: string) {
  return postReviver(JSON.parse(value, reviver)) as T
}

/**
 * Outer replacer function.
 *
 * @param _key
 * @param value
 * @returns
 */
function replacer(_key: string, value: unknown) {
  return _replacer(value)
}

/**
 * Outer reviver function.
 *
 * @param _key
 * @param value
 * @returns
 */
function reviver(_key: string, value: unknown) {
  return _reviver(value)
}

/**
 * Inner replacer function.
 *
 * @param value
 * @returns
 */
function _replacer(value: unknown): unknown {
  // Return value if primitive, function or symbol
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "function" ||
    typeof value === "symbol"
  ) {
    return value
  }

  // Undefined
  if (value === undefined) {
    return {
      [TypeKey.Undefined]: false,
    }
  }

  // NaN
  if (Number.isNaN(value)) {
    return {
      [TypeKey.NaN]: false,
    }
  }

  // bigint
  if (typeof value === "bigint") {
    return {
      [TypeKey.BigInt]: value.toString(),
    }
  }

  // KvU64
  if (value instanceof Deno.KvU64) {
    return {
      [TypeKey.KvU64]: value.value.toString(),
    }
  }

  // Date
  if (value instanceof Date) {
    return {
      [TypeKey.Date]: value.toISOString(),
    }
  }

  // Set
  if (value instanceof Set) {
    const mappedValues: unknown[] = []
    value.forEach((v) => mappedValues.push(_replacer(v)))
    return {
      [TypeKey.Set]: mappedValues,
    }
  }

  // Map
  if (value instanceof Map) {
    const mappedEntries = []
    for (const [k, v] of value.entries()) {
      mappedEntries.push([k, _replacer(v)])
    }
    return {
      [TypeKey.Map]: mappedEntries,
    }
  }

  // RegExp
  if (value instanceof RegExp) {
    return {
      [TypeKey.RegExp]: value.source,
    }
  }

  // Error
  if (value instanceof Error) {
    const jsonError: JSONError = {
      message: value.message,
      name: value.name,
      stack: value.stack,
      cause: value.cause,
    }
    return {
      [TypeKey.Error]: jsonError,
    }
  }

  // Int8Array
  if (value instanceof Int8Array) {
    return {
      [TypeKey.Int8Array]: Array.from(value),
    }
  }

  // Int16Array
  if (value instanceof Int16Array) {
    return {
      [TypeKey.Int16Array]: Array.from(value),
    }
  }

  // Int32Array
  if (value instanceof Int32Array) {
    return {
      [TypeKey.Int32Array]: Array.from(value),
    }
  }

  // BigInt64Array
  if (value instanceof BigInt64Array) {
    return {
      [TypeKey.BigInt64Array]: Array.from(value),
    }
  }

  // Uint8Array
  if (value instanceof Uint8Array) {
    return {
      [TypeKey.Uint8Array]: Array.from(value),
    }
  }

  // Uint16Array
  if (value instanceof Uint16Array) {
    return {
      [TypeKey.Uint16Array]: Array.from(value),
    }
  }

  // Uint32Array
  if (value instanceof Uint32Array) {
    return {
      [TypeKey.Uint32Array]: Array.from(value),
    }
  }

  // BigUint64Array
  if (value instanceof BigUint64Array) {
    return {
      [TypeKey.BigUint64Array]: Array.from(value),
    }
  }

  // Uint8ClampedArray
  if (value instanceof Uint8ClampedArray) {
    return {
      [TypeKey.Uint8ClampedArray]: Array.from(value),
    }
  }

  // Float32Array
  if (value instanceof Float32Array) {
    return {
      [TypeKey.Float32Array]: Array.from(value),
    }
  }

  // Float64Array
  if (value instanceof Float64Array) {
    return {
      [TypeKey.Float64Array]: Array.from(value),
    }
  }

  // ArrayBuffer
  if (value instanceof ArrayBuffer) {
    return {
      [TypeKey.ArrayBuffer]: Array.from(new Uint8Array(value)),
    }
  }

  // DataView
  if (value instanceof DataView) {
    return {
      [TypeKey.DataView]: Array.from(new Uint8Array(value.buffer)),
    }
  }

  // Clone value to handle special cases
  const clone = structuredClone(value) as Record<string, unknown>
  for (const [k, v] of Object.entries(value)) {
    if (v instanceof Date) {
      clone[k] = _replacer(v)
    }

    if (v instanceof Deno.KvU64) {
      clone[k] = _replacer(v)
    }
  }

  // Return clone
  return clone
}

/**
 * Inner reviver function.
 *
 * @param value
 * @returns
 */
function _reviver(value: unknown): unknown {
  // Return if nullish or not an object
  if (
    value === null ||
    value === undefined ||
    typeof value !== "object"
  ) {
    return value
  }

  // NaN
  if (TypeKey.NaN in value) {
    return NaN
  }

  // bigint
  if (TypeKey.BigInt in value) {
    return BigInt(mapValue(TypeKey.BigInt, value))
  }

  // KvU64
  if (TypeKey.KvU64 in value) {
    return new Deno.KvU64(BigInt(mapValue(TypeKey.KvU64, value)))
  }

  // Date
  if (TypeKey.Date in value) {
    return new Date(mapValue<string>(TypeKey.Date, value))
  }

  // Set
  if (TypeKey.Set in value) {
    const mappedValues = mapValue<unknown[]>(TypeKey.Set, value)
    return new Set(mappedValues.map((v) => _reviver(v)))
  }

  // Map
  if (TypeKey.Map in value) {
    const mappedEntries = mapValue<[string, unknown][]>(TypeKey.Map, value)
    return new Map(mappedEntries.map(([k, v]) => [k, _reviver(v)]))
  }

  // RegExp
  if (TypeKey.RegExp in value) {
    return new RegExp(mapValue(TypeKey.RegExp, value))
  }

  // Error
  if (TypeKey.Error in value) {
    const jsonError = mapValue<JSONError>(TypeKey.Error, value)
    const error = new Error(jsonError.message, { ...jsonError })
    error.stack = jsonError.stack
    return error
  }

  // Int8Array
  if (TypeKey.Int8Array in value) {
    return Int8Array.from(mapValue(TypeKey.Int8Array, value))
  }

  // Int16Array
  if (TypeKey.Int16Array in value) {
    return Int16Array.from(mapValue(TypeKey.Int16Array, value))
  }

  // Int32Array
  if (TypeKey.Int32Array in value) {
    return Int32Array.from(mapValue(TypeKey.Int32Array, value))
  }

  // BigInt64Array
  if (TypeKey.BigInt64Array in value) {
    return BigInt64Array.from(mapValue(TypeKey.BigInt64Array, value))
  }

  // Uint8Array
  if (TypeKey.Uint8Array in value) {
    return Uint8Array.from(mapValue(TypeKey.Uint8Array, value))
  }

  // Uint16Array
  if (TypeKey.Uint16Array in value) {
    return Uint16Array.from(mapValue(TypeKey.Uint16Array, value))
  }

  // Uint32Array
  if (TypeKey.Uint32Array in value) {
    return Uint32Array.from(mapValue(TypeKey.Uint32Array, value))
  }

  // BigUint64Array
  if (TypeKey.BigUint64Array in value) {
    return BigUint64Array.from(mapValue(TypeKey.BigUint64Array, value))
  }

  // Uint8ClampedArray
  if (TypeKey.Uint8ClampedArray in value) {
    return Uint8ClampedArray.from(mapValue(TypeKey.Uint8ClampedArray, value))
  }

  // Float32Array
  if (TypeKey.Float32Array in value) {
    return Float32Array.from(mapValue(TypeKey.Float32Array, value))
  }

  // Float64Array
  if (TypeKey.Float64Array in value) {
    return Float64Array.from(mapValue(TypeKey.Float64Array, value))
  }

  // ArrayBuffer
  if (TypeKey.ArrayBuffer in value) {
    const uint8array = Uint8Array.from(mapValue(TypeKey.ArrayBuffer, value))
    return uint8array.buffer
  }

  // DataView
  if (TypeKey.DataView in value) {
    const uint8array = Uint8Array.from(mapValue(TypeKey.DataView, value))
    return new DataView(uint8array.buffer)
  }

  // Return value
  return value
}

/**
 * Reviver post-parse.
 *
 * @param value
 * @returns
 */
function postReviver(value: unknown): unknown {
  if (
    value === undefined ||
    value === null ||
    typeof value !== "object"
  ) {
    return value
  }

  if (TypeKey.Undefined in value) {
    return undefined
  }

  if (Array.isArray(value)) {
    return value.map((v) => postReviver(v))
  }

  if (isKvObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, postReviver(v)]),
    )
  }

  return value
}

/**
 * Map from special type entry to value.
 *
 * @param key - Type key.
 * @param value - JSON value to map from.
 * @returns Mapped value.
 */
function mapValue<T>(key: string, value: unknown) {
  return (value as Record<string, T>)[key]
}
