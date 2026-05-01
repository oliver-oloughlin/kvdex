import { assert, assertEquals } from "@std/assert";
import { mockUser1 } from "../mocks.ts";
import { generateUsers, useDb } from "../utils.ts";

Deno.test("collection - delete", async (t) => {
  await t.step(
    "Should successfully delete a document from the collection",
    async () => {
      await useDb(async (db) => {
        const cr = await db.users.add(mockUser1);
        const count1 = await db.users.count();

        assert(cr.ok);
        assert(count1 === 1);

        await db.users.delete(cr.id);

        const count2 = await db.users.count();
        const doc = await db.users.find(cr.id);

        assert(count2 === 0);
        assert(doc === null);
      });
    },
  );

  await t.step(
    "Should successfully delete document from collection with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.multi_part_id_nums.add(10);
        const count1 = await db.multi_part_id_nums.count();

        assert(cr.ok);
        assertEquals(count1, 1);

        await db.multi_part_id_nums.delete(cr.id);

        const count2 = await db.multi_part_id_nums.count();
        const doc = await db.multi_part_id_nums.find(cr.id);

        assertEquals(count2, 0);
        assertEquals(doc, null);
      });
    },
  );
});
