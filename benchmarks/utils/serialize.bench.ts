import { obj } from "./_object.ts"
import { jsonSerialize, v8Serialize } from "../../src/utils.ts"

Deno.bench("utils - jsonSerialize", () => {
  jsonSerialize(obj)
})

Deno.bench("utils - v8Serialize", () => {
  v8Serialize(obj)
})
