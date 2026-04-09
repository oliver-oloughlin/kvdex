import { assert } from "@std/assert";
import { sleep, useDb } from "../utils.ts";
import { mockUser1, mockUser2 } from "../mocks.ts";

Deno.test("serialized_indexable_collection - getOneBySecondaryIndex", async (t) => {
  await t.step(
    "Should get only one document by a secondary index",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.is_users.add(mockUser1);
        await sleep(100);
        const cr2 = await db.is_users.add(mockUser2);

        assert(cr1.ok);
        assert(cr2.ok);

        const doc = await db.is_users.getOneBySecondaryIndex(
          "age",
          mockUser2.age,
        );
        assert(doc !== null);
        assert(doc.value.username === mockUser1.username);
      });
    },
  );

  await t.step(
    "Should get one by secondary index with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.is_multi_part_id_users.add(mockUser1);
        const cr2 = await db.is_multi_part_id_users.add(mockUser2);
        assert(cr1.ok && cr2.ok);

        const doc = await db.is_multi_part_id_users.getOneBySecondaryIndex(
          "age",
          mockUser1.age,
        );
        assert(doc !== null);
        assert(doc.value.age === mockUser1.age);
      });
    },
  );
});
