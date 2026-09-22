import { assert, assertEquals, assertNotEquals } from "@std/assert";
import {
  mockUser1,
  mockUser2,
  mockUser3,
  mockUsersWithAlteredAge,
} from "../mocks.ts";
import { useDb } from "../utils.ts";

Deno.test("serialized_indexable_collection - deleteManyByOrder", async (t) => {
  await t.step(
    "Should delete documents and indices from the collection by index order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        const count1 = await db.is_users.count();
        assert(cr.ok);
        assertEquals(count1, mockUsersWithAlteredAge.length);

        await db.is_users.deleteManyByOrder("age", {
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
    "Should delete documents and indices from the collection by index order with batched option",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        const count1 = await db.is_users.count();
        assert(cr.ok);
        assertEquals(count1, mockUsersWithAlteredAge.length);

        await db.is_users.deleteManyByOrder("age", {
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
    "Should deleteMany by index order with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_multi_part_id_users.addMany(
          mockUsersWithAlteredAge,
        );
        assert(cr.ok);

        const count1 = await db.is_multi_part_id_users.count();
        assertEquals(count1, mockUsersWithAlteredAge.length);

        await db.is_multi_part_id_users.deleteManyByOrder("age");

        const count2 = await db.is_multi_part_id_users.count();
        assertEquals(count2, 0);
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
        await db.is_users.deleteManyByOrder("age", {
          startValue: 50,
        });

        const { result } = await db.is_users.getManyByOrder("age");
        assertEquals(result.length, 1);
        assertEquals(result[0].value.username, mockUser3.username);
      });
    },
  );

  await t.step(
    "Should delete documents by primary index order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        await db.is_users.deleteManyByOrder("username");

        const count = await db.is_users.count();
        assertEquals(count, 0);
      });
    },
  );

  await t.step(
    "Should delete only the first documents in username order when limited",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        await db.is_users.deleteManyByOrder("username", { limit: 2 });

        const user3 = await db.is_users.findBy(
          "username",
          mockUser3.username,
        );
        assertEquals(user3, null);

        const user2 = await db.is_users.findBy("username", mockUser2.username);
        assertEquals(user2, null);

        const user1 = await db.is_users.findBy(
          "username",
          mockUser1.username,
        );
        assertNotEquals(user1, null);

        const count = await db.is_users.count();
        assertEquals(count, 1);
      });
    },
  );
});
