import { v8Serialize } from "../../src/utils.ts";
import { assert } from "../test.deps.ts";
import { VALUES } from "../values.ts";

Deno.test("utils - v8Serialize", async (t) => {
  await t.step(
    "Should successfully serialize all KvValue type values",
    () => {
      const serialized = VALUES.map((val) => {
        try {
          return v8Serialize(val);
        } catch (e) {
          throw new Error(
            `Failed to serialize value: ${val}, Error: ${e}`,
          );
        }
      });
      assert(serialized.every((val) => val instanceof Uint8Array));
    },
  );
});
