import { assert } from "@std/assert";
import { mockUser1 } from "../mocks.ts";
import { useDb } from "../utils.ts";

Deno.test("indexable_collection - deleteBy", async (t) => {
  await t.step(
    "Should successfully delete a document and its indices from the collection by primary index",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.add(mockUser1);
        const count1 = await db.i_users.count();
        const byPrimary1 = await db.i_users.findBy(
          "username",
          mockUser1.username,
        );
        const bySecondary1 = await db.i_users.getManyBy(
          "age",
          mockUser1.age,
        );

        assert(cr.ok);
        assert(count1 === 1);
        assert(byPrimary1?.id === cr.id);
        assert(bySecondary1.result.at(0)?.id === cr.id);

        await db.i_users.deleteBy("username", mockUser1.username);

        const count2 = await db.i_users.count();
        const doc = await db.i_users.find(cr.id);
        const byPrimary2 = await db.i_users.findBy(
          "username",
          mockUser1.username,
        );
        const bySecondary2 = await db.i_users.getManyBy(
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
    "Should successfully delete a document and its indices from the collection by primary index with batched option",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.add(mockUser1);
        const count1 = await db.i_users.count();
        const byPrimary1 = await db.i_users.findBy(
          "username",
          mockUser1.username,
        );
        const bySecondary1 = await db.i_users.getManyBy(
          "age",
          mockUser1.age,
        );

        assert(cr.ok);
        assert(count1 === 1);
        assert(byPrimary1?.id === cr.id);
        assert(bySecondary1.result.at(0)?.id === cr.id);

        await db.i_users.deleteBy("username", mockUser1.username, {
          batched: true,
        });

        const count2 = await db.i_users.count();
        const doc = await db.i_users.find(cr.id);
        const byPrimary2 = await db.i_users.findBy(
          "username",
          mockUser1.username,
        );
        const bySecondary2 = await db.i_users.getManyBy(
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
    "Should delete document by primary index with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_multi_part_id_users.add(mockUser1);
        assert(cr.ok);

        await db.i_multi_part_id_users.deleteBy(
          "username",
          mockUser1.username,
        );

        const count = await db.i_multi_part_id_users.count();
        assert(count === 0);
      });
    },
  );
});
