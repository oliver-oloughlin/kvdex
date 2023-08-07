import type { IndexableCollection } from "./indexable_collection.ts"
import { LargeCollection } from "./large_collection.ts"
import type {
  AtomicCommitResult,
  CommitResult,
  IndexableCollectionDefinition,
  IndexDataEntry,
  KvId,
  KvKey,
  KvValue,
  LargeCollectionDefinition,
  LargeKvValue,
  Model,
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

  return true
}

/**
 * Set document indices using an atomic operation.
 *
 * @param id - Document id.
 * @param data - Document value.
 * @param atomic - An initialized atomic operation.
 * @param collection - The collection context.
 * @returns The atomic operation with added mutations.
 */
export function setIndices<
  T1 extends Model,
  T2 extends IndexableCollectionDefinition<T1>,
>(
  id: KvId,
  data: T1,
  atomic: Deno.AtomicOperation,
  collection: IndexableCollection<T1, T2>,
) {
  // Set mutable copy of atomic operation
  let op = atomic

  // Set primary indices using primary index list
  collection.primaryIndexList.forEach((index) => {
    // Get the index value from data, if undefined continue to next index
    const indexValue = data[index] as KvId | undefined
    if (typeof indexValue === "undefined") return

    // Create the index key
    const indexKey = extendKey(
      collection.keys.primaryIndexKey,
      index,
      indexValue,
    )

    // Create the index document value
    const indexEntry: IndexDataEntry<T1> = { ...data, __id__: id }

    // Add index insertion to atomic operation, check for exisitng indices
    op = op.set(indexKey, indexEntry).check({
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
      collection.keys.secondaryIndexKey,
      index,
      indexValue,
      id,
    )

    // Add index insertion to atomic operation, check for exisitng indices
    op = op.set(indexKey, data).check({
      key: indexKey,
      versionstamp: null,
    })
  })

  // Return the mutated atomic operation
  return op
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
  T1 extends Model,
  T2 extends IndexableCollectionDefinition<T1>,
>(
  id: KvId,
  data: T1,
  atomic: Deno.AtomicOperation,
  collection: IndexableCollection<T1, T2>,
) {
  // Set mutable copy of atomic operation
  let op = atomic

  // Delete primary indices using primary index list
  collection.primaryIndexList.forEach((index) => {
    // Get the index value from data, if undefined continue to next index
    const indexValue = data[index] as KvId | undefined
    if (typeof indexValue === "undefined") return

    // Create the index key
    const indexKey = extendKey(
      collection.keys.primaryIndexKey,
      index,
      indexValue,
    )

    // Add index deletion to atomic operation
    op = op.delete(indexKey)
  })

  // Delete seocndary indices using secondary index list
  collection.secondaryIndexList.forEach((index) => {
    // Get the index value from data, if undefined continue to next index
    const indexValue = data[index] as KvId | undefined
    if (typeof indexValue === "undefined") return

    // Create the index key
    const indexKey = extendKey(
      collection.keys.secondaryIndexKey,
      index,
      indexValue,
      id,
    )

    // Add index deletion to atomic operation
    op = op.delete(indexKey)
  })

  return op
}

export async function setLargeDocument<const T extends LargeKvValue>(
  id: KvId,
  data: T,
  kv: Deno.Kv,
  collection: LargeCollection<T, LargeCollectionDefinition<T>>,
): Promise<CommitResult<T>> {
  const json = JSON.stringify(data)
  const jsonParts: string[] = []
  const documentKey = extendKey(collection.keys.idKey, id)

  for (let i = 0; i < json.length; i += 25_000) {
    jsonParts.push(json.substring(i, i + 25_000))
  }

  let index = 0
  const crs: AtomicCommitResult[] = []

  for (let i = 0; i < jsonParts.length; i += 10) {
    let atomic = kv.atomic()
    const subParts = jsonParts.slice(i, i + 10)

    subParts.forEach((str) => {
      const key = extendKey(documentKey, index)

      atomic = atomic
        .set(key, str)
        .check({
          key,
          versionstamp: null,
        })

      index++
    })

    const cr = await atomic.commit()
    crs.push(cr)
  }

  const success = crs.length > 0 && crs.every((cr) => cr.ok)
  if (!success) {
    return {
      ok: false,
    }
  }

  const cr = crs[0]!
  const versionstamp = cr.ok ? cr.versionstamp : ""

  return {
    id,
    versionstamp,
    ok: true,
  }
}
