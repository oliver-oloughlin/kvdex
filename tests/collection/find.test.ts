import { assert, assertEquals } from "@std/assert";
import { mockUser1 } from "../mocks.ts";
import { useDb } from "../utils.ts";

Deno.test("collection - find", async (t) => {
  await t.step("Should find document by id", async () => {
    await useDb(async (db) => {
      const id = "id";

      const cr = await db.users.set(id, mockUser1);
      assert(cr.ok);

      const doc = await db.users.find(id);
      assert(doc !== null);
      assert(doc.value.username === mockUser1.username);
    });
  });

  await t.step("Should not find document by non-existing id", async () => {
    await useDb(async (db) => {
      const doc = await db.users.find("123");
      assert(doc === null);
    });
  });

  await t.step("Should find document by multi-part id", async () => {
    await useDb(async (db) => {
      const n = 10;
      const cr = await db.multi_part_id_nums.add(n);
      assert(cr.ok);

      const doc = await db.multi_part_id_nums.find(cr.id);
      assert(doc !== null);
      assertEquals(doc.value, n);
    });
  });
});
