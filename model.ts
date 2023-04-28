
export type Document<T extends Model> = WithId<T> & { 
  versionstamp: Deno.KvEntry<T>["versionstamp"]
}

export type WithId<T extends Model> = T & {
  id: Deno.KvKeyPart
} 

export type Model = KVObject

export type KVObject = {
  [key: string]: KVValue
}

export type KVArray = KVValue[] | Uint8Array

export type KVValue = string | number | boolean | bigint | Deno.KvU64 | KVObject | KVArray