import type { IndexableCollection } from "./indexable_collection.ts"
import type {
  IndexableCollectionDefinition,
  IndexDataEntry,
  KvId,
  KvKey,
  KvValue,
  Model,
} from "./types.ts"

export function generateId() {
  return crypto.randomUUID()
}

export function extendKey(collectionKey: KvKey, ...keyParts: KvKey) {
  return [...collectionKey, ...keyParts] as KvKey
}

export function getDocumentId(key: Deno.KvKey) {
  return key.at(-1)
}

export function keyEq(k1: KvKey, k2: KvKey) {
  return JSON.stringify(k1) === JSON.stringify(k2)
}

export function isKvObject(value: KvValue) {
  if (value !== null && typeof value === "object") {
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

  return false
}

export function setIndices<
  T1 extends Model,
  T2 extends IndexableCollectionDefinition<T1>,
>(
  id: KvId,
  data: T1,
  atomic: Deno.AtomicOperation,
  collection: IndexableCollection<T1, T2>,
) {
  let op = atomic

  collection.primaryIndexList.forEach((index) => {
    const indexValue = data[index] as KvId | undefined
    if (typeof indexValue === "undefined") return

    const indexKey = extendKey(
      collection.keys.primaryIndexKey,
      index,
      indexValue,
    )

    const indexEntry: IndexDataEntry<T1> = { ...data, __id__: id }

    op = op.set(indexKey, indexEntry).check({
      key: indexKey,
      versionstamp: null,
    })
  })

  collection.secondaryIndexList.forEach((index) => {
    const indexValue = data[index] as KvId | undefined
    if (typeof indexValue === "undefined") return

    const indexKey = extendKey(
      collection.keys.secondaryIndexKey,
      index,
      indexValue,
      id,
    )

    op = op.set(indexKey, data).check({
      key: indexKey,
      versionstamp: null,
    })
  })

  return op
}

export function deleteIndices<
  T1 extends Model,
  T2 extends IndexableCollectionDefinition<T1>,
>(
  id: KvId,
  data: T1,
  atomic: Deno.AtomicOperation,
  collection: IndexableCollection<T1, T2>,
) {
  let op = atomic

  collection.primaryIndexList.forEach((index) => {
    const indexValue = data[index] as KvId
    const indexKey = extendKey(
      collection.keys.primaryIndexKey,
      index,
      indexValue,
    )
    op = op.delete(indexKey)
  })

  collection.secondaryIndexList.forEach((index) => {
    const indexValue = data[index] as KvId
    const indexKey = extendKey(
      collection.keys.secondaryIndexKey,
      index,
      indexValue,
      id,
    )
    op = op.delete(indexKey)
  })

  return op
}
