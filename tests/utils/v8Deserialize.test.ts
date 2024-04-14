import { v8Deserialize, v8Serialize } from "../../src/utils.ts"
import { assertEquals } from "../test.deps.ts"
import { VALUES } from "../values.ts"

Deno.test("utils - v8Deserialize", async (t) => {
  await t.step(
    "Should successfully deserialize all KvValue type values from Uint8Array",
    () => {
      const serialized = VALUES.map(v8Serialize)
      const deserialized = serialized.map(v8Deserialize)
      assertEquals(VALUES, deserialized)
    },
  )
})
