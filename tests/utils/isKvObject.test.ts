import { assert } from "../test.deps.ts";
import { TKvU64, TObject, VALUES } from "../values.ts";
import { isKvObject } from "../../src/utils.ts";

Deno.test("utils - isKvObject", async (t) => {
  await t.step("Should return true for normal objects", () => {
    assert(isKvObject(TObject));
    assert(isKvObject(TKvU64));
  });

  await t.step(
    "Should return false for all non-normal objects and primtives",
    () => {
      const objIndex = VALUES.indexOf(TObject);
      const u64Index = VALUES.indexOf(TKvU64);
      const filtered = VALUES.filter((_, i) =>
        i !== objIndex && i !== u64Index
      );
      assert(filtered.every((val) => !isKvObject(val)));
    },
  );
});
