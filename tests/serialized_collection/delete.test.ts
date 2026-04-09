import { assert, assertEquals } from "@std/assert";
import { mockUser1 } from "../mocks.ts";
import { generateLargeUsers, useDb } from "../utils.ts";

Deno.test("serialized_collection - delete", async (t) => {
  await t.step(
    "Should successfully delete a document from the collection",
    async () => {
      await useDb(async (db) => {
        const cr = await db.s_users.add(mockUser1);
        const count1 = await db.s_users.count();

        assert(cr.ok);
        assert(count1 === 1);

        await db.s_users.delete(cr.id);

        const count2 = await db.s_users.count();
        const doc = await db.s_users.find(cr.id);

        assert(count2 === 0);
        assert(doc === null);
      });
    },
  );

  await t.step(
    "Should successfully delete 1000 documents from the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(100);
        const cr = await db.s_users.addMany(users);
        const count1 = await db.s_users.count();

        assert(cr.ok);
        assert(count1 === users.length);

        const { result: ids } = await db.s_users.map((doc) => doc.id);

        await db.s_users.delete(...ids);

        const count2 = await db.s_users.count();
        assert(count2 === 0);
      });
    },
  );

  await t.step(
    "Should successfully delete document from collection with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.s_multi_part_id_nums.add(10);
        const count1 = await db.s_multi_part_id_nums.count();

        assert(cr.ok);
        assertEquals(count1, 1);

        await db.s_multi_part_id_nums.delete(cr.id);

        const count2 = await db.s_multi_part_id_nums.count();
        const doc = await db.s_multi_part_id_nums.find(cr.id);

        assertEquals(count2, 0);
        assertEquals(doc, null);
      });
    },
  );
});
