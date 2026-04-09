import { assert, assertEquals } from "@std/assert";
import { sleep, useDb } from "../utils.ts";
import { mockUser1, mockUser2 } from "../mocks.ts";

Deno.test("collection - getOne", async (t) => {
  await t.step("Should get only one document", async () => {
    await useDb(async (db) => {
      const cr1 = await db.users.add(mockUser1);
      await sleep(100);
      const cr2 = await db.users.add(mockUser2);

      assert(cr1.ok);
      assert(cr2.ok);

      const doc = await db.users.getOne();
      assert(doc !== null);
      assert(doc.value.username === mockUser1.username);
    });
  });

  await t.step("Should get one document with multi-part id", async () => {
    await useDb(async (db) => {
      const n1 = 10;
      const n2 = 20;
      const cr1 = await db.multi_part_id_nums.add(n1);
      await sleep(100);
      const cr2 = await db.multi_part_id_nums.add(n2);

      assert(cr1.ok);
      assert(cr2.ok);

      const doc = await db.multi_part_id_nums.getOne();
      assert(doc !== null);
      assertEquals(doc.value, n1);
    });
  });
});
