import { Document, model } from "../../mod.ts";
import { assert, z } from "../test.deps.ts";

Deno.test("document - properties", async (t) => {
  await t.step("Should create document with Model", () => {
    let assertion = true;

    try {
      new Document(model<number>(), {
        id: "id",
        versionstamp: "000",
        value: 100,
      });
    } catch (_) {
      assertion = false;
    }

    assert(assertion);
  });

  await t.step(
    "Should parse and create document with ParserModel (zod)",
    () => {
      let assertion = true;

      try {
        new Document(z.number(), {
          id: "id",
          versionstamp: "000",
          value: 100,
        });
      } catch (_) {
        assertion = false;
      }

      assert(assertion);
    },
  );

  await t.step(
    "Should fail to parse and create document with ParserModel (zod)",
    () => {
      let assertion = false;

      try {
        new Document(z.number(), {
          id: "id",
          versionstamp: "000",
          value: "100" as unknown as number,
        });
      } catch (_) {
        assertion = true;
      }

      assert(assertion);
    },
  );
});
