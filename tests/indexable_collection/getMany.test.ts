import { assert } from "@std/assert";
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts";
import { generateUsers } from "../utils.ts";
import { useDb } from "../utils.ts";

Deno.test("indexable_collection - getMany", async (t) => {
  await t.step("Should get all documents", async () => {
    await useDb(async (db) => {
      const users = generateUsers(1_000);
      const cr = await db.i_users.addMany(users);
      assert(cr.ok);

      const { result } = await db.i_users.getMany();
      assert(result.length === users.length);
      assert(
        users.every((user) =>
          result.some((doc) => doc.value.username === user.username)
        ),
      );
    });
  });

  await t.step("Should get all documents with multi-part id", async () => {
    await useDb(async (db) => {
      const users = [mockUser1, mockUser2, mockUser3];
      const cr = await db.i_multi_part_id_users.addMany(users);
      assert(cr.ok);

      const { result } = await db.i_multi_part_id_users.getMany();
      assert(result.length === users.length);
      assert(
        users.every((user) =>
          result.some((doc) => doc.value.username === user.username)
        ),
      );
    });
  });
});
