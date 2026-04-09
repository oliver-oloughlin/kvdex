import { assert } from "@std/assert";
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts";
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

  await t.step(
    "Should run callback mapper function for each document with multi-part id",
    async () => {
      await useDb(async (db) => {
        const users = [mockUser1, mockUser2, mockUser3];
        const cr = await db.is_multi_part_id_users.addMany(users);
        assert(cr.ok);

        const { result } = await db.is_multi_part_id_users.map((doc) =>
          doc.value.username
        );

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
