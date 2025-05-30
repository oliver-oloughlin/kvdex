import {
  mockUser1,
  mockUser2,
  mockUser3,
  mockUsersWithAlteredAge,
} from "../mocks.ts";
import { assert } from "@std/assert";
import { useDb } from "../utils.ts";

Deno.test("indexable_collection - getManyBySecondaryOrder", async (t) => {
  await t.step("Should get all documents by secondary order", async () => {
    await useDb(async (db) => {
      const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
      assert(cr.ok);

      const { result } = await db.i_users.getManyBySecondaryOrder("age");
      assert(result.length === mockUsersWithAlteredAge.length);
      assert(result[0].value.username === mockUser3.username);
      assert(result[1].value.username === mockUser1.username);
      assert(result[2].value.username === mockUser2.username);
    });
  });
});
