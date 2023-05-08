import type { Document, KvObject } from "./kvdb.types.ts"

export function generateId() {
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

/**
 * Flattens a document at the top level, placing the id and versionstamp together with the document data.
 * Only applicable to documents of KvObject data.
 * 
 * @param document - The document to flatten.
 * @returns A flattened document with the document data, id and versionstamp.
 */
export function flatten<T extends KvObject>(document: Document<T>) {
  const { value, ...rest } = document
  return {
    ...value,
    ...rest
  }
}