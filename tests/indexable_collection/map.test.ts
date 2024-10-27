import { assert } from "../test.deps.ts";
import { generateUsers, useDb } from "../utils.ts";

Deno.test("indexable_collection - map", async (t) => {
  await t.step(
    "Should run callback mapper function for each document in the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000);
        const cr = await db.i_users.addMany(users);
        assert(cr.ok);

        const { result } = await db.i_users.map((doc) => doc.value.username);

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
