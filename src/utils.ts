import { GET_MANY_KEY_LIMIT } from "./constants.ts";
import type { Collection } from "./collection.ts";
import type {
  DenoAtomicOperation,
  DenoKv,
  DenoKvEntryMaybe,
  DenoKvListSelector,
  DenoKvSetOptions,
  DenoKvStrictKey,
  Encoder,
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
  WatchManager,
  WatchOptions,
} from "./types.ts";
import { ulid } from "@std/ulid";
import { jsonEncoder } from "./ext/encoding/mod.ts";

/**
 * Generate a new document id.
 *
 * @returns A generated id of type KvId.
 */
export function generateId() {
  return ulid();
}

/**
 * Get a document id from a document key.
 *
 * @param key - A document key.
 * @returns A document id, or undefined if key is empty.
 */
export function getDocumentId(key: DenoKvStrictKey) {
  return key.at(-1);
}

/**
 * Extend a kv key with key parts.
 *
 * @param key - The input key to be extended.
 * @param keyParts - Key parts to add to the input key.
 * @returns An extended kv key.
 */
export function extendKey(key: KvKey, ...keyParts: KvKey) {
  return [...key, ...keyParts] as KvKey;
}

/**
 * Compare two kv keys for equality.
 *
 * @param k1 - First kv key.
 * @param k2 - Second kv key.
 * @returns true if keys are equal, false if not.
 */
export function keyEq(k1: KvKey, k2: KvKey) {
  return JSON.stringify(k1) === JSON.stringify(k2);
}

export async function encodeData(
  value: unknown,
  encoder: Encoder = jsonEncoder(),
): Promise<Uint8Array> {
  const { serializer, compressor } = encoder;
  const serialized = await serializer.serialize(value);
  return compressor ? await compressor.compress(serialized) : serialized;
}

export async function decodeData<T>(
  value: Uint8Array,
  encoder: Encoder = jsonEncoder(),
): Promise<T> {
  const { serializer, compressor } = encoder;
  const decompressed = compressor ? await compressor.decompress(value) : value;
  return await serializer.deserialize<T>(decompressed);
}

/**
 * Create a secondary index key prefix.
 *
 * @param index - Index.
 * @param value - Index value.
 * @param collection - Collection.
 * @returns A key prefix from a secondary index.
 */
export async function createSecondaryIndexKeyPrefix(
  index: string | number | symbol,
  value: KvValue,
  collection: Collection<any, any, any>,
) {
  // Serialize and compress index value
  const encoded = await encodeData(value, collection._encoder);

  // Create prefix key
  return extendKey(
    collection._keys.secondaryIndex,
    index as KvId,
    encoded,
  );
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
    return false;
  }

  // If value is not an object, return false
  if (typeof value !== "object") {
    return false;
  }

  // If value is an instance of other KvValue objects, return false
  if (
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
    // TODO: value instanceof Float16Array ||
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
    return false;
  }

  // Return true after performing all checks
  return true;
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
export async function setIndices(
  id: KvId,
  data: KvObject,
  value: KvObject,
  atomic: DenoAtomicOperation,
  collection: Collection<any, any, any>,
  options: DenoKvSetOptions | undefined,
) {
  await handleIndices(
    id,
    data,
    collection,
    (primaryIndexKey) => {
      const indexEntry: IndexDataEntry<KvObject> = {
        ...value,
        __id__: id,
      };

      atomic.set(primaryIndexKey, indexEntry, options).check({
        key: primaryIndexKey,
        versionstamp: null,
      });
    },
    (secondaryIndexKey) => {
      atomic.set(secondaryIndexKey, value, options);
    },
  );
}

/**
 * Check for index collisions when inserting update data.
 *
 * @param data - Update data.
 * @param atomic - Atomic operation.
 * @param collection - Collection context.
 * @returns The atomic operation with added checks.
 */
export async function checkIndices(
  data: KvObject,
  atomic: DenoAtomicOperation,
  collection: Collection<any, any, any>,
) {
  await handleIndices(
    null,
    data,
    collection,
    (primaryIndexKey) => {
      atomic.check({
        key: primaryIndexKey,
        versionstamp: null,
      });
    },
  );
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
export async function deleteIndices(
  id: KvId,
  data: KvObject,
  atomic: DenoAtomicOperation,
  collection: Collection<any, any, any>,
) {
  await handleIndices(
    id,
    data,
    collection,
    (primaryIndexKey) => atomic.delete(primaryIndexKey),
    (secondaryIndexKey) => atomic.delete(secondaryIndexKey),
  );
}

/**
 * Perform kv.getMany with sliced executions to allow for more keys than internal limit.
 *
 * @param keys - List of keys.
 * @param kv - DenoKV instance.
 * @param options - Find many options.
 * @returns List of entries.
 */
export async function kvGetMany(
  keys: DenoKvStrictKey[],
  kv: DenoKv,
  options?: FindManyOptions,
) {
  // Initialize sliced keys list
  const slicedKeys: DenoKvStrictKey[][] = [];

  // Slice keys based on getMany keys limit
  for (let i = 0; i < keys.length; i += GET_MANY_KEY_LIMIT) {
    slicedKeys.push(keys.slice(i, i + GET_MANY_KEY_LIMIT));
  }

  // Execute getMany for each sliced keys entry
  const slicedEntries = await allFulfilled(slicedKeys.map((keys) => {
    return kv.getMany(keys, options);
  }));

  // Return accumulated result
  return slicedEntries.flat();
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
  const settled = await Promise.allSettled(values);

  // Return fulfilled values
  return settled.reduce(
    (acc, result) =>
      result.status === "fulfilled" ? [...acc, result.value] : acc,
    [] as Awaited<T>[],
  );
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
  };

  // Create keys if undelivered
  const keysIfUndelivered = options?.idsIfUndelivered?.map((id) =>
    extendKey(undeliveredKey, id)
  );

  // Return prepared enqueue
  return {
    msg,
    options: {
      ...options,
      keysIfUndelivered,
    },
  };
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
  return `${JSON.stringify(key)}${topic ?? ""}`;
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
    };
  }

  // Cast message as QueueMessage
  const _msg = msg as QueueMessage<T>;

  // Check correctness of message parts
  if (
    !_msg.__handlerId__ ||
    (_msg.__data__ === undefined && !_msg.__is_undefined__)
  ) {
    return {
      ok: false,
    };
  }

  // Return parsed queue message
  return {
    ok: true,
    msg: _msg,
  };
}

/**
 * Create a list selector from a prefix key and list options.
 *
 * @param prefixKey - Key prefix.
 * @param options - List options.
 * @returns A list selector.
 */
export function createListSelector<T1, T2 extends KvId>(
  prefixKey: KvKey,
  options: ListOptions<T1, T2> | undefined,
): DenoKvListSelector {
  // Create start key
  const start = typeof options?.startId !== "undefined"
    ? [...prefixKey, options.startId!]
    : undefined;

  // Create end key
  const end = typeof options?.endId !== "undefined"
    ? [...prefixKey, options.endId!]
    : undefined;

  // Conditionally set prefix key
  const prefix = Array.isArray(start) && Array.isArray(end)
    ? undefined!
    : prefixKey;

  const selector = { prefix, start, end };
  if (!selector.end) delete selector.end;
  if (!selector.start) delete selector.start;
  // Return list selector
  return selector;
}

/**
 * Create kv list options from given options.
 *
 * @param options
 * @returns
 */
export function createListOptions<T1, T2 extends KvId>(
  options: ListOptions<T1, T2> | undefined,
) {
  const limit = options?.limit && options.limit + (options.offset ?? 0);
  return {
    ...options,
    limit,
  };
}

/**
 *  Checks whether the specified list options selects all entries or potentially limits the selection.
 *
 * @param options - List options.
 * @returns true if list options selects all entries, false if potentially not.
 */
export function selectsAll<T1, T2 extends KvId>(
  options: ListOptions<T1, T2> | undefined,
) {
  return (
    !options?.consistency &&
    !options?.cursor &&
    !options?.endId &&
    !options?.startId &&
    !options?.filter &&
    !options?.limit &&
    !options?.offset
  );
}

export function createWatcher(
  kv: DenoKv,
  options: WatchOptions | undefined,
  keys: KvKey[],
  fn: (entries: DenoKvEntryMaybe[]) => unknown,
): WatchManager {
  // Create watch stream
  const stream = kv.watch(keys, options);
  const reader = stream.getReader();

  // Receive incoming updates
  const promise = async () => {
    let isDone = false;
    while (!isDone) {
      try {
        const { value, done } = await reader.read();
        if (value) {
          await fn(value);
        }

        isDone = done;
      } catch (_) {
        isDone = true;
      }
    }
  };

  // Create cancel function
  async function cancel() {
    reader.releaseLock();
    await stream.cancel();
  }

  return { promise: promise(), cancel };
}

async function handleIndices(
  id: KvId | null,
  data: KvObject,
  collection: Collection<any, any, any>,
  primary: (indexKey: KvKey) => void,
  secondary?: (indexKey: KvKey) => void,
): Promise<void> {
  // Handle primary indices
  for (const index of collection._primaryIndexList) {
    const indexValue = data[index] as KvId | undefined;
    if (typeof indexValue === "undefined") continue;

    const encoded = await encodeData(indexValue, collection._encoder);

    const indexKey = extendKey(
      collection._keys.primaryIndex,
      index,
      encoded,
    );

    primary(indexKey);
  }

  if (!secondary || !id) {
    return;
  }

  // Handle secondary indices
  for (const index of collection._secondaryIndexList) {
    const indexValue = data[index] as KvId | undefined;
    if (typeof indexValue === "undefined") continue;

    const encoded = await encodeData(indexValue, collection._encoder);

    const indexKey = extendKey(
      collection._keys.secondaryIndex,
      index,
      encoded,
      id,
    );

    secondary(indexKey);
  }
}
