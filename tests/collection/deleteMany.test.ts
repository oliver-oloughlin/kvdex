import { assert, assertEquals } from "@std/assert";
import { generateUsers, useDb } from "../utils.ts";

Deno.test("collection - deleteMany", async (t) => {
  await t.step("Should delete all documents from the collection", async () => {
    await useDb(async (db) => {
      const users = generateUsers(1_000);
      const cr = await db.users.addMany(users);
      assert(cr.ok);

      const count1 = await db.users.count();
      assertEquals(count1, users.length);

      await db.users.deleteMany();

      const count2 = await db.users.count();
      assertEquals(count2, 0);
    });
  });

  await t.step(
    "Should delete all documents from collection with multi-part id",
    async () => {
      await useDb(async (db) => {
        const values = [1, 2, 3, 4, 5];
        const cr = await db.multi_part_id_nums.addMany(values);
        assert(cr.ok);

        const count1 = await db.multi_part_id_nums.count();
        assertEquals(count1, values.length);

        await db.multi_part_id_nums.deleteMany();

        const count2 = await db.multi_part_id_nums.count();
        assertEquals(count2, 0);
      });
    },
  );
});
