import { obj } from "./_object.ts"
import { denoCoreSerialize, jsonSerialize } from "../../src/utils.ts"

Deno.bench("utils - jsonSerialize", () => {
  jsonSerialize(obj)
})

Deno.bench("utils - denoCoreSerialize", () => {
  denoCoreSerialize(obj)
})
