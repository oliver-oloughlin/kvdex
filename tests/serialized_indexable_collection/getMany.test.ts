import { assert } from "@std/assert";
import { generateLargeUsers, useDb } from "../utils.ts";

Deno.test("serialized_indexable_collection - getMany", async (t) => {
  await t.step("Should get all documents", async () => {
    await useDb(async (db) => {
      const users = generateLargeUsers(100);
      const cr = await db.is_users.addMany(users);
      assert(cr.ok);

      const { result } = await db.is_users.getMany();
      assert(result.length === users.length);
      assert(
        users.every((user) =>
          result.some((doc) => doc.value.username === user.username)
        ),
      );
    });
  });
});
