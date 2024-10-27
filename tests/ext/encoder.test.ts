import { jsonDeserialize, jsonSerialize } from "../../src/utils.ts";
import { assertEquals } from "../test.deps.ts";
import { VALUES } from "../values.ts";
import { assert } from "../test.deps.ts";
import { v8Deserialize, v8Serialize } from "../../src/utils.ts";

Deno.test("ext - encoder", async (t) => {
  await t.step("json", async (t) => {
    await t.step(
      "Should successfully serialize all KvValue type values",
      () => {
        const serialized = VALUES.map(jsonSerialize);
        assert(serialized.every((val) => val instanceof Uint8Array));
      },
    );

    await t.step(
      "Should successfully deserialize all KvValue type values from Uint8Array",
      () => {
        const serialized = VALUES.map(jsonSerialize);
        const deserialized = serialized.map(jsonDeserialize);
        assertEquals(VALUES, deserialized);
      },
    );
  });

  await t.step("v8", async (t) => {
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

    await t.step(
      "Should successfully deserialize all KvValue type values from Uint8Array",
      () => {
        const serialized = VALUES.map(v8Serialize);
        const deserialized = serialized.map((val) => {
          try {
            return v8Deserialize(val);
          } catch (e) {
            throw new Error(`Failed to deserialize value: ${val}, Error: ${e}`);
          }
        });
        assertEquals(VALUES, deserialized);
      },
    );
  });
});
