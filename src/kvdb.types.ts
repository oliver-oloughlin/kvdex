
export type Document<T extends KvValue> = {
  id: KvId,
  versionstamp: Deno.KvEntry<T>["versionstamp"],
  value: T
}

export type KvKey = Deno.KvKey

export type KvId = Deno.KvKeyPart

export type Model = Omit<KvObject, "id">

export type KvObject = {
  [key: string]: KvValue
}

export type KvArray = KvValue[]

export type KvValue = string | number | boolean | bigint | Deno.KvU64 | KvObject | KvArray | Uint8Array