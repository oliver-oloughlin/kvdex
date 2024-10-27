import { assert } from "../test.deps.ts";
import { mockUser1 } from "../mocks.ts";
import { generateUsers, useDb } from "../utils.ts";

Deno.test("indexable_collection - delete", async (t) => {
  await t.step(
    "Should successfully delete a document and its indices from the collection",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.add(mockUser1);
        const count1 = await db.i_users.count();
        const byPrimary1 = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        );
        const bySecondary1 = await db.i_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        );

        assert(cr.ok);
        assert(count1 === 1);
        assert(byPrimary1?.id === cr.id);
        assert(bySecondary1.result.at(0)?.id === cr.id);

        await db.i_users.delete(cr.id);

        const count2 = await db.i_users.count();
        const doc = await db.i_users.find(cr.id);
        const byPrimary2 = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        );
        const bySecondary2 = await db.i_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        );

        assert(count2 === 0);
        assert(doc === null);
        assert(byPrimary2 === null);
        assert(bySecondary2.result.length === 0);
      });
    },
  );

  await t.step(
    "Should successfully delete 1000 documents from the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000);
        const cr = await db.i_users.addMany(users);
        const count1 = await db.i_users.count();

        assert(cr.ok);
        assert(count1 === users.length);

        const { result: ids } = await db.i_users.map((doc) => doc.id);

        await db.i_users.delete(...ids);

        const count2 = await db.i_users.count();
        assert(count2 === 0);
      });
    },
  );
});
