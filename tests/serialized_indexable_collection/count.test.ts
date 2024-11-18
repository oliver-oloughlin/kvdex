import { assert } from "@std/assert";
import { generateLargeUsers, useDb } from "../utils.ts";

Deno.test("serialized_indexable_collection - count", async (t) => {
  await t.step(
    "Should correctly count total number of documents in the collection",
    async () => {
      await useDb(async (db) => {
        const count1 = await db.is_users.count();
        assert(count1 === 0);

        const users = generateLargeUsers(1_000);
        const cr = await db.is_users.addMany(users);
        assert(cr.ok);

        const count2 = await db.is_users.count();
        assert(count2 === users.length);
      });
    },
  );
});
