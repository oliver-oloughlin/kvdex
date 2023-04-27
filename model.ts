
export type Document<T extends Model> = T & { id: Deno.KvKeyPart }

export type Model = JSONObject

export type JSONValue = PrimitiveValue | JSONObject | JSONArray

export type JSONObject = {
  [key: string]: JSONValue
}

export type JSONArray = JSONValue[]

export type PrimitiveValue = string | number | boolean