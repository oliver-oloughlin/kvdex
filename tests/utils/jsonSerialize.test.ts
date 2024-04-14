import { jsonSerialize } from "../../src/utils.ts"
import { assert } from "../test.deps.ts"
import { VALUES } from "../values.ts"

Deno.test("utils - jsonSerialize", async (t) => {
  await t.step(
    "Should successfully serialize all KvValue type values",
    () => {
      const serialized = VALUES.map(jsonSerialize)
      assert(serialized.every((val) => val instanceof Uint8Array))
    },
  )
})
