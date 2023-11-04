import { GET_MANY_KEY_LIMIT, UNDELIVERED_KEY_PREFIX } from "./constants.ts"
import type { IndexableCollection } from "./indexable_collection.ts"
import type {
  AtomicSetOptions,
  EnqueueOptions,
  FindManyOptions,
  IndexableCollectionOptions,
  IndexDataEntry,
  KvId,
  KvKey,
  KvObject,
  KvValue,
  ListOptions,
  ParsedQueueMessage,
  PreparedEnqueue,
  QueueMessage,
  QueueValue,
  UpdateData,
} from "./types.ts"

/**
 * Generate a random document id.
 *
 * @returns A generated id of type KvId.
 */
export function generateId() {
  return crypto.randomUUID()
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
export function isKvObject(value: KvValue) {
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
export function setIndices<
  T1 extends KvObject,
  T2 extends IndexableCollectionOptions<T1>,
>(
  id: KvId,
  data: T1,
  atomic: Deno.AtomicOperation,
  collection: IndexableCollection<T1, T2>,
  options: AtomicSetOptions | undefined,
) {
  // Set primary indices using primary index list
  collection.primaryIndexList.forEach((index) => {
    // Get the index value from data, if undefined continue to next index
    const indexValue = data[index] as KvId | undefined
    if (typeof indexValue === "undefined") return

    // Create the index key
    const indexKey = extendKey(
      collection._keys.primaryIndexKey,
      index,
      indexValue,
    )

    // Create the index document value
    const indexEntry: IndexDataEntry<T1> = { ...data, __id__: id }

    // Add index insertion to atomic operation, check for exisitng indices
    atomic.set(indexKey, indexEntry, options).check({
      key: indexKey,
      versionstamp: null,
    })
  })

  // Set secondary indices using secondary index list
  collection.secondaryIndexList.forEach((index) => {
    // Get the index value from data, if undefined continue to next index
    const indexValue = data[index] as KvId | undefined
    if (typeof indexValue === "undefined") return

    // Create the index key
    const indexKey = extendKey(
      collection._keys.secondaryIndexKey,
      index,
      indexValue,
      id,
    )

    // Add index insertion to atomic operation, check for exisitng indices
    atomic.set(indexKey, data, options)
  })

  // Return the mutated atomic operation
  return atomic
}

/**
 * Check for index collisions when inserting update data.
 *
 * @param id - Document id.
 * @param data - Update data.
 * @param atomic - Atomic operation.
 * @param collection - Collection context.
 * @returns The atomic operation with added checks.
 */
export function checkIndices<
  T1 extends KvObject,
  T2 extends T1 | UpdateData<T1>,
  T3 extends IndexableCollectionOptions<T1>,
>(
  data: T2,
  atomic: Deno.AtomicOperation,
  collection: IndexableCollection<T1, T3>,
) {
  // Check primary indices using primary index list
  collection.primaryIndexList.forEach((index) => {
    // Get the index value from data, if undefined continue to next index
    const indexValue = data[index] as KvId | undefined
    if (typeof indexValue === "undefined") {
      return
    }

    // Create the index key
    const indexKey = extendKey(
      collection._keys.primaryIndexKey,
      index,
      indexValue,
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
export function deleteIndices<
  T1 extends KvObject,
  T2 extends IndexableCollectionOptions<T1>,
>(
  id: KvId,
  data: T1,
  atomic: Deno.AtomicOperation,
  collection: IndexableCollection<T1, T2>,
) {
  // Delete primary indices using primary index list
  collection.primaryIndexList.forEach((index) => {
    // Get the index value from data, if undefined continue to next index
    const indexValue = data[index] as KvId | undefined
    if (typeof indexValue === "undefined") return

    // Create the index key
    const indexKey = extendKey(
      collection._keys.primaryIndexKey,
      index,
      indexValue,
    )

    // Add index deletion to atomic operation
    atomic.delete(indexKey)
  })

  // Delete seocndary indices using secondary index list
  collection.secondaryIndexList.forEach((index) => {
    // Get the index value from data, if undefined continue to next index
    const indexValue = data[index] as KvId | undefined
    if (typeof indexValue === "undefined") return

    // Create the index key
    const indexKey = extendKey(
      collection._keys.secondaryIndexKey,
      index,
      indexValue,
      id,
    )

    // Add index deletion to atomic operation
    atomic.delete(indexKey)
  })

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
export function prepareEnqueue<const T extends QueueValue>(
  key: KvKey,
  data: T,
  options: EnqueueOptions | undefined,
): PreparedEnqueue<T> {
  // Create queue message
  const msg: QueueMessage<T> = {
    __data__: data,
    __handlerId__: createHandlerId(key, options?.topic),
  }

  // Create keys if undelivered
  const keysIfUndelivered = options?.idsIfUndelivered?.map((id) =>
    extendKey(key, UNDELIVERED_KEY_PREFIX, id)
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
export function parseQueueMessage<T extends QueueValue>(
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
    !_msg.__handlerId__ || _msg.__data__ === undefined
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
export function createListSelector<const T extends KvValue>(
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

/**
 *  Checks whether the specified list options selects all entries or potentially limits the selection.
 *
 * @param options - List options.
 * @returns true if list options selects all entries, false if potentially not.
 */
export function selectsAll<T extends KvValue>(
  options: ListOptions<T> | undefined,
) {
  return (
    !options?.consistency &&
    !options?.cursor &&
    !options?.endId &&
    !options?.startId &&
    !options?.filter &&
    !options?.limit
  )
}

/**
 * Clamp a number between a lower and upper limit.
 *
 * @param min - Lower limit.
 * @param n - Number to be clamped.
 * @param max - Upper limit.
 * @returns - A clamped value.
 */
export function clamp(min: number, n: number, max: number) {
  return Math.min(Math.max(min, n), max)
}

/**
 * Deep merge two or more objects.
 * @param target - Target object, of which keys will take lowest priority.
 * @param sources - Source objects in ascending priority.
 */
export function deepMerge<T1 extends KvValue, T2 extends KvValue[]>(
  target: T1,
  ...sources: T2
): T1 & T2[number] {
  // Check for exhausted sources
  if (!sources.length) {
    return target as T1 & T2[number]
  }

  // Get next source object
  const source = sources.shift()

  // Check if target and source are kv objects
  if (isKvObject(target) && isKvObject(source)) {
    // Type cast target and source as KvObject
    const t = target as KvObject
    const s = source as KvObject

    // Loop over every key in source, merge accordingly
    for (const key in s) {
      if (isKvObject(s[key])) {
        if (!t[key]) t[key] = {}
        deepMerge(t[key], s[key])
      } else {
        t[key] = s[key]
      }
    }
  }

  // Return recursively merged objects
  return deepMerge(target, ...sources)
}
