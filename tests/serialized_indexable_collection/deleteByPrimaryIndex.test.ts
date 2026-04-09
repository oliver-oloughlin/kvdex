import { assert } from "@std/assert";
import { mockUser1 } from "../mocks.ts";
import { generateLargeUsers, useDb } from "../utils.ts";

const [user] = generateLargeUsers(1);

Deno.test("serialized_indexable_collection - deleteByPrimaryIndex", async (t) => {
  await t.step(
    "Should successfully delete a document and its indices from the collection by primary index",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.add(user);
        const count1 = await db.is_users.count();
        const byPrimary1 = await db.is_users.findByPrimaryIndex(
          "username",
          user.username,
        );
        const bySecondary1 = await db.is_users.findBySecondaryIndex(
          "age",
          user.age,
        );

        assert(cr.ok);
        assert(count1 === 1);
        assert(byPrimary1?.id === cr.id);
        assert(bySecondary1.result.at(0)?.id === cr.id);

        await db.is_users.deleteByPrimaryIndex("username", user.username);

        const count2 = await db.is_users.count();
        const doc = await db.is_users.find(cr.id);
        const byPrimary2 = await db.is_users.findByPrimaryIndex(
          "username",
          user.username,
        );
        const bySecondary2 = await db.is_users.findBySecondaryIndex(
          "age",
          user.age,
        );

        assert(count2 === 0);
        assert(doc === null);
        assert(byPrimary2 === null);
        assert(bySecondary2.result.length === 0);
      });
    },
  );

  await t.step(
    "Should delete document by primary index with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_multi_part_id_users.add(mockUser1);
        assert(cr.ok);

        await db.is_multi_part_id_users.deleteByPrimaryIndex(
          "username",
          mockUser1.username,
        );

        const count = await db.is_multi_part_id_users.count();
        assert(count === 0);
      });
    },
  );
});
