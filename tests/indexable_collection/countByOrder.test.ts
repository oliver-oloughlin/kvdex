import { assert, assertEquals } from "@std/assert";
import { mockUser1, mockUser2, mockUsersWithAlteredAge } from "../mocks.ts";
import { useDb } from "../utils.ts";

Deno.test("indexable_collection - countByOrder", async (t) => {
  await t.step(
    "Should correctly count total number of documents in the collection by index order",
    async () => {
      await useDb(async (db) => {
        const count1 = await db.i_users.countByOrder(
          "age",
        );
        assertEquals(count1, 0);

        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const count2 = await db.i_users.countByOrder(
          "age",
          {
            limit: 1,
            filter: (doc) => doc.value.age < mockUser1.age,
          },
        );

        assertEquals(count2, 1);

        const count3 = await db.i_users.countByOrder(
          "age",
          {
            limit: 2,
            filter: (doc) => doc.value.age < mockUser2.age,
          },
        );

        assertEquals(count3, 2);

        const count4 = await db.i_users.countByOrder("age");
        assertEquals(count4, 3);
      });
    },
  );

  await t.step(
    "Should count by index order with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_multi_part_id_users.addMany(
          mockUsersWithAlteredAge,
        );
        assert(cr.ok);

        const count = await db.i_multi_part_id_users.countByOrder(
          "age",
        );
        assertEquals(count, mockUsersWithAlteredAge.length);
      });
    },
  );

  await t.step(
    "Should count documents bounded by start and end values",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        // startValue is inclusive
        const startCount = await db.i_users.countByOrder("age", {
          startValue: 50,
        });
        assertEquals(startCount, 2);

        // endValue is exclusive
        const endCount = await db.i_users.countByOrder("age", {
          endValue: 80,
        });
        assertEquals(endCount, 2);

        // Combined start and end bounds
        const rangeCount = await db.i_users.countByOrder("age", {
          startValue: 50,
          endValue: 80,
        });
        assertEquals(rangeCount, 1);
      });
    },
  );

  await t.step(
    "Should count all documents by primary index order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const count = await db.i_users.countByOrder("username");
        assertEquals(count, mockUsersWithAlteredAge.length);
      });
    },
  );

  await t.step(
    "Should count documents by primary index order with limit and filter",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const count = await db.i_users.countByOrder("username", {
          limit: 2,
          filter: (doc) => doc.value.age > 60,
        });
        assertEquals(count, 1);
      });
    },
  );

  await t.step(
    "Should count documents by primary index order bounded by start and end values",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const startCount = await db.i_users.countByOrder("username", {
          startValue: mockUser2.username,
        });
        assertEquals(startCount, 2);

        const endCount = await db.i_users.countByOrder("username", {
          endValue: mockUser1.username,
        });
        assertEquals(endCount, 2);

        const rangeCount = await db.i_users.countByOrder("username", {
          startValue: mockUser2.username,
          endValue: mockUser1.username,
        });
        assertEquals(rangeCount, 1);
      });
    },
  );
});
