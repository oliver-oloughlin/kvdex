
export type Document<T extends KvValue> = {
  id: KvId,
  versionstamp: Deno.KvEntry<T>["versionstamp"],
  value: T
}

export type KvKey = [Deno.KvKeyPart, ...Deno.KvKey]

export type KvId = Deno.KvKeyPart

export type Model = Omit<KvObject, "id">

export type KvObject = {
  [key: string | number]: KvValue
}

export type KvArray = KvValue[]

export type KvValue = 
  | string 
  | number 
  | boolean 
  | bigint
  | Deno.KvU64 
  | KvObject 
  | KvArray 
  | Int8Array
  | Int16Array
  | Int32Array
  | BigInt64Array
  | Uint8Array 
  | Uint16Array
  | Uint32Array
  | BigUint64Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array
  | Date
  | Set<unknown>
  | Map<unknown, unknown>