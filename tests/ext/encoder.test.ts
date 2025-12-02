import { assert, assertEquals, assertInstanceOf } from "@std/assert";
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
        const serialized = VALUES.map(([, val]) => jsonSerialize(val));
        assert(serialized.every((val) => val instanceof Uint8Array));
      },
    );

    await t.step(
      "Should successfully deserialize all KvValue type values from Uint8Array",
      () => {
        VALUES.forEach(([label, val]) => {
          const seralized = jsonSerialize(val);
          const deserialized = jsonDeserialize(seralized);
          assertEquals(val, deserialized, `Type: ${label}`);
        });
      },
    );
  });

  await t.step("v8", async (t) => {
    await t.step(
      "Should successfully serialize all KvValue type values",
      () => {
        VALUES.forEach(([label, val]) => {
          const serialized = v8Serialize(val);
          assertInstanceOf(serialized, Uint8Array, `Type: ${label}`);
        });
      },
    );

    await t.step(
      "Should successfully deserialize all KvValue type values from Uint8Array",
      () => {
        VALUES.forEach(([label, val]) => {
          const serialized = v8Serialize(val);
          const deserialized = v8Deserialize(serialized);
          assertEquals(val, deserialized, `Type: ${label}`);
        });
      },
    );
  });
});
