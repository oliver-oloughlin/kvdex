import { assert, assertEquals } from "@std/assert";
import { generateLargeUsers, useDb } from "../utils.ts";

Deno.test("serialized_collection - deleteMany", async (t) => {
  await t.step("Should delete all documents from the collection", async () => {
    await useDb(async (db) => {
      const users = generateLargeUsers(100);
      const cr = await db.s_users.addMany(users);
      assert(cr.ok);

      const count1 = await db.s_users.count();
      assert(count1 === users.length);

      await db.s_users.deleteMany();

      const count2 = await db.s_users.count();
      assert(count2 === 0);
    });
  });

  await t.step(
    "Should delete all documents from collection with multi-part id",
    async () => {
      await useDb(async (db) => {
        const values = [1, 2, 3, 4, 5];
        const cr = await db.s_multi_part_id_nums.addMany(values);
        assert(cr.ok);

        const count1 = await db.s_multi_part_id_nums.count();
        assertEquals(count1, values.length);

        await db.s_multi_part_id_nums.deleteMany();

        const count2 = await db.s_multi_part_id_nums.count();
        assertEquals(count2, 0);
      });
    },
  );
});
