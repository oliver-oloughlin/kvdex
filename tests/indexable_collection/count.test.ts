import { assert } from "@std/assert";
import { mockUser1, mockUser2 } from "../mocks.ts";
import { generateUsers, useDb } from "../utils.ts";

Deno.test("indexable_collection - count", async (t) => {
  await t.step(
    "Should correctly count total number of documents in the collection",
    async () => {
      await useDb(async (db) => {
        const count1 = await db.i_users.count();
        assert(count1 === 0);

        const users = generateUsers(1_000);
        const cr = await db.i_users.addMany(users);
        assert(cr.ok);

        const count2 = await db.i_users.count();
        assert(count2 === users.length);
      });
    },
  );

  await t.step(
    "Should correctly count documents in collection with multi-part id",
    async () => {
      await useDb(async (db) => {
        const count1 = await db.i_multi_part_id_users.count();
        assert(count1 === 0);

        const cr1 = await db.i_multi_part_id_users.add(mockUser1);
        const cr2 = await db.i_multi_part_id_users.add(mockUser2);
        assert(cr1.ok && cr2.ok);

        const count2 = await db.i_multi_part_id_users.count();
        assert(count2 === 2);

        const count3 = await db.i_multi_part_id_users.count({
          filter: (doc) => doc.value.username === mockUser1.username,
        });
        assert(count3 === 1);
      });
    },
  );
});
