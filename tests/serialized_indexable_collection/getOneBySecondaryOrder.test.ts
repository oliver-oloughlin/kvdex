import { assert } from "../test.deps.ts";
import { useDb } from "../utils.ts";
import { mockUser3, mockUsersWithAlteredAge } from "../mocks.ts";

Deno.test("serialized_indexable_collection - getOneBySecondaryOrder", async (t) => {
  await t.step("Should get only one document by secondary order", async () => {
    await useDb(async (db) => {
      const cr = await db.is_users.addMany(mockUsersWithAlteredAge);

      assert(cr.ok);

      const doc = await db.is_users.getOneBySecondaryOrder("age");
      assert(doc !== null);
      assert(doc.value.username === mockUser3.username);
    });
  });
});
