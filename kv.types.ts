
export type Document<T extends Model> = {
  id: DocumentId,
  versionstamp: Deno.KvEntry<T>["versionstamp"],
  value: T
}

export type DocumentId = Deno.KvKeyPart

export type Model = KVObject

export type KVObject = {
  [key: string]: KVValue
}

export type KVArray = KVValue[] | Uint8Array

export type KVValue = string | number | boolean | bigint | Deno.KvU64 | KVObject | KVArray