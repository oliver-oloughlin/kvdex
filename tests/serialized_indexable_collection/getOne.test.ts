import { assert } from "@std/assert";
import { sleep, useDb } from "../utils.ts";
import { mockUser1, mockUser2 } from "../mocks.ts";

Deno.test("serialized_indexable_collection - getOne", async (t) => {
  await t.step("Should get only one document", async () => {
    await useDb(async (db) => {
      const cr1 = await db.is_users.add(mockUser1);
      await sleep(100);
      const cr2 = await db.is_users.add(mockUser2);

      assert(cr1.ok);
      assert(cr2.ok);

      const doc = await db.is_users.getOne();
      assert(doc !== null);
      assert(doc.value.username === mockUser1.username);
    });
  });

  await t.step("Should get one document with multi-part id", async () => {
    await useDb(async (db) => {
      const cr1 = await db.is_multi_part_id_users.add(mockUser1);
      await sleep(100);
      const cr2 = await db.is_multi_part_id_users.add(mockUser2);

      assert(cr1.ok);
      assert(cr2.ok);

      const doc = await db.is_multi_part_id_users.getOne();
      assert(doc !== null);
      assert(doc.value.username === mockUser1.username);
    });
  });
});
