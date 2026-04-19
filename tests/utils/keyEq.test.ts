import { assert } from "@std/assert";
import { keyEq } from "../../src/core/utils.ts";
import type { KvKey } from "../../src/core/types.ts";

Deno.test("utils - keyEq", async (t) => {
  // ---- Equal keys ----

  await t.step("Should return true for equal single string keys", () => {
    assert(keyEq(["hello"], ["hello"]));
  });

  await t.step("Should return true for equal single number keys", () => {
    assert(keyEq([42], [42]));
  });

  await t.step("Should return true for equal single bigint keys", () => {
    assert(keyEq([100n], [100n]));
  });

  await t.step("Should return true for equal single boolean keys", () => {
    assert(keyEq([true], [true]));
    assert(keyEq([false], [false]));
  });

  await t.step("Should return true for equal single Uint8Array keys", () => {
    assert(keyEq(
      [new Uint8Array([1, 2, 3])],
      [new Uint8Array([1, 2, 3])],
    ));
  });

  await t.step("Should return true for equal empty Uint8Array keys", () => {
    assert(keyEq(
      [new Uint8Array([])],
      [new Uint8Array([])],
    ));
  });

  await t.step(
    "Should return true for equal multi-part keys with mixed types",
    () => {
      assert(keyEq(
        ["users", 1, true, 50n, new Uint8Array([0xFF])],
        ["users", 1, true, 50n, new Uint8Array([0xFF])],
      ));
    },
  );

  await t.step("Should return true for keys with special number values", () => {
    assert(keyEq([0], [0]));
    assert(keyEq([-0], [-0]));
    assert(keyEq([Infinity], [Infinity]));
    assert(keyEq([-Infinity], [-Infinity]));
  });

  await t.step("Should return true for keys with empty string", () => {
    assert(keyEq([""], [""]));
  });

  await t.step("Should return true for keys with negative bigint", () => {
    assert(keyEq([-999n], [-999n]));
  });

  // ---- Unequal keys - different values ----

  await t.step("Should return false for different string keys", () => {
    assert(!keyEq(["hello"], ["world"]));
  });

  await t.step("Should return false for different number keys", () => {
    assert(!keyEq([1], [2]));
  });

  await t.step("Should return false for different bigint keys", () => {
    assert(!keyEq([100n], [200n]));
  });

  await t.step("Should return false for different boolean keys", () => {
    assert(!keyEq([true], [false]));
  });

  await t.step("Should return false for different Uint8Array keys", () => {
    assert(
      !keyEq(
        [new Uint8Array([1, 2, 3])],
        [new Uint8Array([1, 2, 4])],
      ),
    );
  });

  await t.step(
    "Should return false for Uint8Array keys of different lengths",
    () => {
      assert(
        !keyEq(
          [new Uint8Array([1, 2])],
          [new Uint8Array([1, 2, 3])],
        ),
      );
    },
  );

  // ---- Unequal keys - different types (almost equal / lookalike) ----

  await t.step("Should return false for number 100 vs bigint 100n", () => {
    assert(!keyEq([100], [100n] as unknown as KvKey));
  });

  await t.step("Should return false for number 0 vs bigint 0n", () => {
    assert(!keyEq([0], [0n] as unknown as KvKey));
  });

  await t.step("Should return false for string '1' vs number 1", () => {
    assert(!keyEq(["1"], [1] as unknown as KvKey));
  });

  await t.step("Should return false for string 'true' vs boolean true", () => {
    assert(!keyEq(["true"], [true] as unknown as KvKey));
  });

  await t.step(
    "Should return false for string 'false' vs boolean false",
    () => {
      assert(!keyEq(["false"], [false] as unknown as KvKey));
    },
  );

  await t.step("Should return false for boolean true vs number 1", () => {
    assert(!keyEq([true], [1] as unknown as KvKey));
  });

  await t.step("Should return false for boolean false vs number 0", () => {
    assert(!keyEq([false], [0] as unknown as KvKey));
  });

  await t.step("Should return false for string '0' vs boolean false", () => {
    assert(!keyEq(["0"], [false] as unknown as KvKey));
  });

  await t.step("Should return false for Uint8Array vs number", () => {
    assert(
      !keyEq(
        [new Uint8Array([1])],
        [1] as unknown as KvKey,
      ),
    );
  });

  await t.step("Should return false for Uint8Array vs string", () => {
    assert(
      !keyEq(
        [new Uint8Array([])],
        [""] as unknown as KvKey,
      ),
    );
  });

  // ---- Keys of different lengths ----

  await t.step("Should return false when first key is longer", () => {
    assert(!keyEq(["a", "b"], ["a"]));
  });

  await t.step("Should return false when second key is longer", () => {
    assert(!keyEq(["a"], ["a", "b"]));
  });

  await t.step("Should return false for single-part vs multi-part key", () => {
    assert(!keyEq(["users"], ["users", "1", "data"]));
  });

  await t.step("Should return false for multi-part vs single-part key", () => {
    assert(!keyEq(["users", "1", "data"], ["users"]));
  });

  // ---- Multi-part key differences ----

  await t.step("Should return false when keys differ only in last part", () => {
    assert(
      !keyEq(
        ["users", 1, "name"],
        ["users", 1, "age"],
      ),
    );
  });

  await t.step(
    "Should return false when keys differ only in first part",
    () => {
      assert(
        !keyEq(
          ["users", 1, "data"],
          ["posts", 1, "data"],
        ),
      );
    },
  );

  await t.step(
    "Should return false when keys differ only in middle part",
    () => {
      assert(
        !keyEq(
          ["coll", 1, "end"],
          ["coll", 2, "end"],
        ),
      );
    },
  );

  await t.step(
    "Should return false when multi-part keys differ by type in one part",
    () => {
      assert(
        !keyEq(
          ["coll", 1, "end"],
          ["coll", 1n, "end"] as unknown as KvKey,
        ),
      );
    },
  );

  // ---- NaN handling ----

  await t.step("Should return false for NaN vs NaN (strict inequality)", () => {
    assert(!keyEq([NaN], [NaN] as unknown as KvKey));
  });

  // ---- 0 vs -0 ----

  await t.step(
    "Should return true for 0 vs -0 (strict equality treats them as equal)",
    () => {
      assert(keyEq([0], [-0]));
    },
  );

  // ---- Large keys ----

  await t.step("Should return true for large equal keys", () => {
    const k1: KvKey = ["a", 1, true, 2n, "b", 3, false, 4n, "c", 5];
    const k2: KvKey = ["a", 1, true, 2n, "b", 3, false, 4n, "c", 5];
    assert(keyEq(k1, k2));
  });

  await t.step(
    "Should return false for large keys differing at the end",
    () => {
      const k1: KvKey = ["a", 1, true, 2n, "b", 3, false, 4n, "c", 5];
      const k2: KvKey = ["a", 1, true, 2n, "b", 3, false, 4n, "c", 6];
      assert(!keyEq(k1, k2));
    },
  );

  // ---- Uint8Array edge cases ----

  await t.step("Should return true for same Uint8Array reference", () => {
    const buf = new Uint8Array([10, 20, 30]);
    assert(keyEq([buf], [buf]));
  });

  await t.step(
    "Should return true for different Uint8Array references with equal content",
    () => {
      assert(keyEq(
        [new Uint8Array([10, 20, 30])],
        [new Uint8Array([10, 20, 30])],
      ));
    },
  );

  await t.step("Should return false for Uint8Array with one extra byte", () => {
    assert(
      !keyEq(
        [new Uint8Array([1, 2, 3])],
        [new Uint8Array([1, 2, 3, 4])],
      ),
    );
  });
});
