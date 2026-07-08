import { assert, assertEquals } from "@std/assert";
import { mockUser2, mockUser3, mockUsersWithAlteredAge } from "../mocks.ts";
import { useDb } from "../utils.ts";

Deno.test("serialized_indexable_collection - deleteManyBySecondaryOrder", async (t) => {
  await t.step(
    "Should delete documents and indices from the collection by secondary order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        const count1 = await db.is_users.count();
        assert(cr.ok);
        assertEquals(count1, mockUsersWithAlteredAge.length);

        await db.is_users.deleteManyBySecondaryOrder("age", {
          limit: mockUsersWithAlteredAge.length - 1,
        });

        const count2 = await db.is_users.count();
        const doc = await db.is_users.getOne();

        assertEquals(count2, 1);
        assertEquals(doc?.value.username, mockUser2.username);
        assertEquals(doc?.value.address, mockUser2.address);
      });
    },
  );

  await t.step(
    "Should delete documents and indices from the collection by secondary order with batched option",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        const count1 = await db.is_users.count();
        assert(cr.ok);
        assertEquals(count1, mockUsersWithAlteredAge.length);

        await db.is_users.deleteManyBySecondaryOrder("age", {
          limit: mockUsersWithAlteredAge.length - 1,
          batched: true,
        });

        const count2 = await db.is_users.count();
        const doc = await db.is_users.getOne();

        assertEquals(count2, 1);
        assertEquals(doc?.value.username, mockUser2.username);
        assertEquals(doc?.value.address, mockUser2.address);
      });
    },
  );

  await t.step(
    "Should deleteMany by secondary order with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_multi_part_id_users.addMany(
          mockUsersWithAlteredAge,
        );
        assert(cr.ok);

        const count1 = await db.is_multi_part_id_users.count();
        assert(count1 === mockUsersWithAlteredAge.length);

        await db.is_multi_part_id_users.deleteManyBySecondaryOrder("age");

        const count2 = await db.is_multi_part_id_users.count();
        assert(count2 === 0);
      });
    },
  );

  await t.step(
    "Should delete documents bounded by start and end values",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        // Delete documents with age >= 50 (user1, user2), leaving user3 (age 20)
        await db.is_users.deleteManyBySecondaryOrder("age", {
          startValue: 50,
        });

        const { result } = await db.is_users.getManyBySecondaryOrder("age");
        assertEquals(result.length, 1);
        assertEquals(result[0].value.username, mockUser3.username);
      });
    },
  );
});
