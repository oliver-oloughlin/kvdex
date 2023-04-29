
export function generateDocumentId() {
  return crypto.randomUUID()
}

export function getDocumentKey(collectionKey: Deno.KvKey, id: Deno.KvKeyPart) {
  return [...collectionKey, id]
}

export function getDocumentId(key: Deno.KvKey) {
  return key.at(-1)
}

export async function useKV<T>(fn: (kv: Deno.Kv) => Promise<T>) {
  const kv = await Deno.openKv()
  const result = await fn(kv)
  await kv.close()
  return result
}