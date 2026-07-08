import { assert } from "@std/assert";
import { useDb } from "../utils.ts";
import { mockUser1, mockUser3, mockUsersWithAlteredAge } from "../mocks.ts";

Deno.test("serialized_indexable_collection - getOneBySecondaryOrder", async (t) => {
  await t.step("Should get only one document by secondary order", async () => {
    await useDb(async (db) => {
      const cr = await db.is_users.addMany(mockUsersWithAlteredAge);

      assert(cr.ok);

      const doc = await db.is_users.getOneBySecondaryOrder("age");
      assert(doc !== null);
      assert(doc.value.username === mockUser3.username);
    });
  });

  await t.step(
    "Should get one by secondary order with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_multi_part_id_users.addMany(
          mockUsersWithAlteredAge,
        );
        assert(cr.ok);

        const doc = await db.is_multi_part_id_users.getOneBySecondaryOrder(
          "age",
        );
        assert(doc !== null);
      });
    },
  );

  await t.step(
    "Should get one document by secondary order bounded by start and end values",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        // startValue is inclusive, returns first document from the bound
        const start = await db.is_users.getOneBySecondaryOrder("age", {
          startValue: 50,
        });
        assert(start !== null);
        assert(start.value.username === mockUser1.username);

        // endValue is exclusive, returns first document before the bound
        const end = await db.is_users.getOneBySecondaryOrder("age", {
          endValue: 50,
        });
        assert(end !== null);
        assert(end.value.username === mockUser3.username);
      });
    },
  );
});
