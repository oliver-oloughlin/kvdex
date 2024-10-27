import { assert } from "../test.deps.ts";
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
});
