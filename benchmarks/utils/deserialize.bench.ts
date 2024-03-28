import { obj } from "./_object.ts"
import {
  jsonDeserialize,
  jsonSerialize,
  v8Deserialize,
  v8Serialize,
} from "../../src/utils.ts"

const js = jsonSerialize(obj)
const ds = v8Serialize(obj)

console.log("JSON size:", js.byteLength / 1024 / 1024, "MB")
console.log("V8 size:", ds.byteLength / 1024 / 1024, "MB")

Deno.bench("utils - jsonDeserialize", () => {
  jsonDeserialize(js)
})

Deno.bench("utils - v8Deserialize", () => {
  v8Deserialize(ds)
})
