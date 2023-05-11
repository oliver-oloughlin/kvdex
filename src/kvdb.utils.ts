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

export async function useKV<const T>(fn: (kv: Deno.Kv) => Promise<T>) {
  const kv = await Deno.openKv()
  const result = await fn(kv)
  await kv.close()
  return result
}
