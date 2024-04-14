import {
  v8Deserialize as deserialize,
  v8Serialize as serialize,
} from "../../src/utils.ts"
import { assertEquals } from "../test.deps.ts"
import { VALUES } from "../values.ts"

Deno.test("utils - v8Deserialize", async (t) => {
  await t.step(
    "Should successfully deserialize all KvValue type values from Uint8Array",
    () => {
      const serialized = VALUES.map(serialize)
      const deserialized = serialized.map(deserialize)
      assertEquals(serialized, deserialized)
    },
  )
})
