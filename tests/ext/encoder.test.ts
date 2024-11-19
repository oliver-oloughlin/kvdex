import { assert, assertEquals } from "@std/assert";
import { VALUES } from "../values.ts";
import {
  jsonDeserialize,
  jsonSerialize,
  v8Deserialize,
  v8Serialize,
} from "../../src/ext/encoding/mod.ts";

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
        VALUES.forEach((val) => {
          const seralized = jsonSerialize(val);
          const deserialized = jsonDeserialize(seralized);
          assertEquals(val, deserialized);
        });
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
        VALUES.forEach((val) => {
          const serialized = v8Serialize(val);
          try {
            const deserialized = v8Deserialize(serialized);
            assertEquals(val, deserialized);
          } catch (e) {
            throw new Error(`Failed to deserialize value: ${val}, Error: ${e}`);
          }
        });
      },
    );
  });
});
