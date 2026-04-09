import { assert } from "@std/assert";
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts";
import { generateLargeUsers, useDb } from "../utils.ts";

Deno.test("serialized_indexable_collection - deleteMany", async (t) => {
  await t.step(
    "Should delete all documents and indices from the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(100);
        const user1 = users[0];

        const cr = await db.is_users.addMany(users);
        const count1 = await db.is_users.count();
        const byPrimary1 = await db.is_users.findByPrimaryIndex(
          "username",
          user1.username,
        );
        const bySecondary1 = await db.is_users.findBySecondaryIndex(
          "age",
          user1.age,
        );

        assert(cr.ok);
        assert(count1 === users.length);
        assert(byPrimary1?.value.username === user1.username);
        assert(bySecondary1.result.length > 0);

        await db.is_users.deleteMany();

        const count2 = await db.is_users.count();
        const byPrimary2 = await db.is_users.findByPrimaryIndex(
          "username",
          user1.username,
        );
        const bySecondary2 = await db.is_users.findBySecondaryIndex(
          "age",
          user1.age,
        );

        assert(count2 === 0);
        assert(byPrimary2 === null);
        assert(bySecondary2.result.length === 0);
      });
    },
  );

  await t.step(
    "Should delete all documents from collection with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_multi_part_id_users.addMany([
          mockUser1,
          mockUser2,
          mockUser3,
        ]);
        assert(cr.ok);

        const count1 = await db.is_multi_part_id_users.count();
        assert(count1 === 3);

        await db.is_multi_part_id_users.deleteMany();

        const count2 = await db.is_multi_part_id_users.count();
        assert(count2 === 0);
      });
    },
  );
});
