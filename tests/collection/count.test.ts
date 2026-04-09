import { assert, assertEquals } from "@std/assert";
import { generateUsers } from "../utils.ts";
import { useDb } from "../utils.ts";

Deno.test("collection - count", async (t) => {
  await t.step(
    "Should correctly count total number of documents in the collection",
    async () => {
      await useDb(async (db) => {
        const count1 = await db.users.count();
        assert(count1 === 0);

        const users = generateUsers(1_000);
        const cr = await db.users.addMany(users);
        assert(cr.ok);

        const count2 = await db.users.count();
        assert(count2 === users.length);
      });
    },
  );

  await t.step(
    "Should correctly count documents in collection with multi-part id",
    async () => {
      await useDb(async (db) => {
        const count1 = await db.multi_part_id_nums.count();
        assertEquals(count1, 0);

        const n1 = 10;
        const n2 = 20;
        const cr1 = await db.multi_part_id_nums.add(n1);
        const cr2 = await db.multi_part_id_nums.add(n2);
        assert(cr1.ok && cr2.ok);

        const count2 = await db.multi_part_id_nums.count();
        assertEquals(count2, 2);

        const count3 = await db.multi_part_id_nums.count({
          filter: (doc) => doc.value === n1,
        });
        assertEquals(count3, 1);
      });
    },
  );
});
