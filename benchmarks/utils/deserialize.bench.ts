import { obj } from "./_object.ts"
import {
  denoCoreDeserialize,
  denoCoreSerialize,
  jsonDeserialize,
  jsonSerialize,
} from "../../src/utils.ts"

const js = jsonSerialize(obj)
const ds = denoCoreSerialize(obj)

console.log("JSON size:", js.byteLength / 1024 / 1024, "MB")
console.log("Deno Core size:", ds.byteLength / 1024 / 1024, "MB")

Deno.bench("utils - jsonDeserialize", () => {
  jsonDeserialize(js)
})

Deno.bench("utils - denoCoreDeserialize", () => {
  denoCoreDeserialize(ds)
})
