import { parse } from "../../src/utils.ts";
import { model } from "../../mod.ts";
import { assertEquals } from "@std/assert/equals";
import { assertNotEquals } from "@std/assert/not-equals";
import { z } from "zod";
import { assertThrows } from "@std/assert/throws";
import { assert } from "node:console";

Deno.test("utils - parse", async (t) => {
  await t.step(
    "Should successfully parse document using standard model and correct data type (inference only)",
    async () => {
      const m = model<string>();
      const val = "test";

      const parsed = await parse(m, val);
      assertEquals(parsed, val);
    },
  );

  await t.step(
    "Should successfully parse document using standard model and incorrect data type (inference only)",
    async () => {
      const m = model<string>();
      const val = "test";

      const parsed = await parse(m, null);
      assertNotEquals(parsed, val);
    },
  );

  await t.step(
    "Should successfully parse document using Zod schema and correct data type",
    async () => {
      const m = z.string();
      const val = "test";

      const parsed = await parse(m, val);
      assertEquals(parsed, val);
    },
  );

  await t.step(
    "Should not successfully parse document using Zod schema and incorrect data type",
    async () => {
      const m = z.string();
      const val = 10;

      try {
        await parse(m, val);
        assert(false);
      } catch (_) {
        assert(true);
      }
    },
  );

  await t.step(
    "Should transform from input to output using standard model",
    () => {
      const m = model((n: number) => `${n}`);
      const input = 10;
      const output = "10";

      const transformed = m["~kvdex"]?.transform?.(input);
      assertEquals(transformed, output);
    },
  );
});
