import { assert } from "@std/assert";
import { generateLargeUsers, useDb } from "../utils.ts";

Deno.test("serialized_collection - count", async (t) => {
  await t.step(
    "Should correctly count total number of documents in the collection",
    async () => {
      await useDb(async (db) => {
        const count1 = await db.s_users.count();
        assert(count1 === 0);

        const users = generateLargeUsers(100);
        const cr = await db.s_users.addMany(users);
        assert(cr.ok);

        const count2 = await db.s_users.count();
        assert(count2 === users.length);
      });
    },
  );
});
