import { assert } from "../test.deps.ts";
import { mockUser1 } from "../mocks.ts";
import { useDb } from "../utils.ts";

Deno.test("indexable_collection - find", async (t) => {
  await t.step("Should find document by id", async () => {
    await useDb(async (db) => {
      const id = "id";

      const cr = await db.i_users.set(id, mockUser1);
      assert(cr.ok);

      const doc = await db.i_users.find(id);
      assert(doc !== null);
      assert(doc.value.username === mockUser1.username);
    });
  });

  await t.step("Should not find document by non-existing id", async () => {
    await useDb(async (db) => {
      const doc = await db.i_users.find("123");
      assert(doc === null);
    });
  });
});
