import { assert } from "@std/assert";
import { mockUser1, mockUser2 } from "../mocks.ts";
import { TransformUserModel } from "../models.ts";
import { useDb } from "../utils.ts";
import { parse } from "../../src/utils.ts";

Deno.test("serialized_indexable_collection - findBySecondaryIndex", async (t) => {
  await t.step("Should find documents by secondary index", async () => {
    await useDb(async (db) => {
      const cr1 = await db.i_users.add(mockUser1);
      const cr2 = await db.i_users.add(mockUser2);
      assert(cr1.ok && cr2.ok);

      const bySecondary = await db.i_users.findBySecondaryIndex(
        "age",
        mockUser1.age,
      );

      assert(bySecondary.result.length === 2);
      assert(bySecondary.result.some((doc) => doc.id === cr1.id));
      assert(bySecondary.result.some((doc) => doc.id === cr2.id));
    });
  });

  await t.step(
    "Should not find documents by non-existing secondary index",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.i_users.add(mockUser1);
        const cr2 = await db.i_users.add(mockUser2);
        assert(cr1.ok && cr2.ok);

        const bySecondary = await db.i_users.findBySecondaryIndex(
          "age",
          -1,
        );

        assert(bySecondary.result.length === 0);
      });
    },
  );

  await t.step(
    "Should find documents by asymmetric model secondary index",
    async () => {
      await useDb(async (db) => {
        const t1 = await parse(TransformUserModel, mockUser1);
        const t2 = await parse(TransformUserModel, mockUser2);

        const cr = await db.ai_users.addMany([mockUser1, mockUser2]);
        assert(cr.ok);

        const { result } = await db.ai_users.findBySecondaryIndex(
          "decadeAge",
          t1.decadeAge,
        );
        result.some((doc) => doc.value.name === t1.name);
        result.some((doc) => doc.value.name === t2.name);
      });
    },
  );
});
