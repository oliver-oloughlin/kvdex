import type { KvKey, KvValue } from "./types.ts"

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