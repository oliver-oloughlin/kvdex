import { jsonDeserialize, jsonSerialize } from "../../src/utils.ts"
import { assertEquals } from "../test.deps.ts"
import { VALUES } from "../values.ts"

Deno.test("utils - jsonDeserialize", async (t) => {
  await t.step(
    "Should successfully deserialize all KvValue type values from Uint8Array",
    () => {
      const serialized = VALUES.map(jsonSerialize)
      const deserialized = serialized.map(jsonDeserialize)
      assertEquals(serialized, deserialized)
    },
  )
})
