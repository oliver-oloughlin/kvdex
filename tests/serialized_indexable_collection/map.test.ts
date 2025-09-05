import { assert } from "@std/assert";
import { generateLargeUsers, useDb } from "../utils.ts";

Deno.test("serialized_indexable_collection - map", async (t) => {
  await t.step(
    "Should run callback mapper function for each document in the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(100);
        const cr = await db.is_users.addMany(users);
        assert(cr.ok);

        const { result } = await db.is_users.map((doc) => doc.value.username);

        assert(result.length === users.length);
        assert(
          users.every((user) =>
            result.some((username) => username === user.username)
          ),
        );
      });
    },
  );
});
