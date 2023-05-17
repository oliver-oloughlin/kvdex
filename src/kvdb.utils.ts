import type { KvId, KvKey } from "./kvdb.types.ts"

export function generateId() {
  return crypto.randomUUID()
}

export function extendKey(collectionKey: KvKey, id: KvId) {
  return [...collectionKey, id] as KvKey
}

export function getDocumentId(key: KvKey) {
  return key.at(-1)
}

export function keyEq(k1: KvKey, k2: KvKey) {
  return JSON.stringify(k1) === JSON.stringify(k2)
}
