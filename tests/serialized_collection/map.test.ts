import { assert, assertEquals } from "@std/assert";
import { generateLargeUsers, useDb } from "../utils.ts";

Deno.test("serialized_collection - map", async (t) => {
  await t.step(
    "Should run callback mapper function for each document in the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(100);
        const cr = await db.s_users.addMany(users);
        assert(cr.ok);

        const { result } = await db.s_users.map((doc) => doc.value.username);

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
        const values = [1, 2, 3, 4, 5];
        const cr = await db.s_multi_part_id_nums.addMany(values);
        assert(cr.ok);

        const { result } = await db.s_multi_part_id_nums.map((doc) =>
          doc.value
        );

        assertEquals(result.length, values.length);
        assert(
          values.every((value) => result.some((mapped) => mapped === value)),
        );
      });
    },
  );
});
