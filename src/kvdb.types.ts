
export type Document<T extends KvValue> = {
  id: DocumentId,
  versionstamp: Deno.KvEntry<T>["versionstamp"],
  value: T
}

export type DocumentId = Deno.KvKeyPart

export type KvObject = {
  [key: string]: KvValue
}

export type KvArray = KvValue[]

export type KvValue = string | number | boolean | bigint | Deno.KvU64 | KvObject | KvArray | Uint8Array