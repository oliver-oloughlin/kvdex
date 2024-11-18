import { assert } from "@std/assert";
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts";
import { useDb } from "../utils.ts";

Deno.test("indexable_collection - mapBySecondaryIndex", async (t) => {
  await t.step(
    "Should run callback mapper function for each document in the collection by secondary index",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany([mockUser1, mockUser2, mockUser3]);
        assert(cr.ok);

        const { result } = await db.i_users.mapBySecondaryIndex(
          "age",
          mockUser1.age,
          (doc) => doc.value.username,
        );

        assert(result.length === 2);
        assert(result.some((username) => username === mockUser1.username));
        assert(result.some((username) => username === mockUser2.username));
        assert(!result.some((username) => username === mockUser3.username));
      });
    },
  );
});
