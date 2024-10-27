import { assert } from "../test.deps.ts";
import { mockUser1, mockUser2, mockUsersWithAlteredAge } from "../mocks.ts";
import { useDb } from "../utils.ts";

Deno.test("serialized_indexable_collection - countBySecondaryOrder", async (t) => {
  await t.step(
    "Should correctly count total number of documents in the collection by secondary order",
    async () => {
      await useDb(async (db) => {
        const count1 = await db.is_users.countBySecondaryOrder(
          "age",
        );
        assert(count1 === 0);

        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const count2 = await db.is_users.countBySecondaryOrder(
          "age",
          {
            limit: 1,
            filter: (doc) => doc.value.age < mockUser1.age,
          },
        );

        assert(count2 === 1);

        const count3 = await db.is_users.countBySecondaryOrder(
          "age",
          {
            limit: 2,
            filter: (doc) => doc.value.age < mockUser2.age,
          },
        );

        assert(count3 === 2);

        const count4 = await db.is_users.countBySecondaryOrder("age");
        assert(count4 === 3);
      });
    },
  );
});
