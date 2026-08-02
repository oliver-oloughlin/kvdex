import { assert, assertEquals } from "@std/assert";
import {
  mockUser1,
  mockUser2,
  mockUser3,
  mockUsersWithAlteredAge,
} from "../mocks.ts";
import { useDb } from "../utils.ts";

Deno.test("indexable_collection - mapByOrder", async (t) => {
  await t.step(
    "Should run callback mapper function for each document in the collection by index order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const { result } = await db.i_users.mapByOrder(
          "age",
          (doc) => doc.value.username,
        );

        assertEquals(result[0], mockUser3.username);
        assertEquals(result[1], mockUser1.username);
        assertEquals(result[2], mockUser2.username);
      });
    },
  );

  await t.step(
    "Should map by index order with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_multi_part_id_users.addMany(
          mockUsersWithAlteredAge,
        );
        assert(cr.ok);

        const { result } = await db.i_multi_part_id_users.mapByOrder(
          "age",
          (doc) => doc.value.username,
        );

        assertEquals(result.length, mockUsersWithAlteredAge.length);
      });
    },
  );

  await t.step(
    "Should map documents bounded by start and end values",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        // startValue is inclusive
        const start = await db.i_users.mapByOrder(
          "age",
          (doc) => doc.value.username,
          { startValue: 50 },
        );
        assertEquals(start.result.length, 2);
        assertEquals(start.result[0], mockUser1.username);
        assertEquals(start.result[1], mockUser2.username);

        // endValue is exclusive
        const end = await db.i_users.mapByOrder(
          "age",
          (doc) => doc.value.username,
          { endValue: 80 },
        );
        assertEquals(end.result.length, 2);
        assertEquals(end.result[0], mockUser3.username);
        assertEquals(end.result[1], mockUser1.username);
      });
    },
  );

  await t.step(
    "Should map documents by primary index order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const { result } = await db.i_users.mapByOrder(
          "username",
          (doc) => doc.value.username,
        );
        assertEquals(result, [
          mockUser3.username,
          mockUser2.username,
          mockUser1.username,
        ]);
      });
    },
  );

  await t.step(
    "Should map documents by primary index order with limit",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const limited = await db.i_users.mapByOrder(
          "username",
          (doc) => doc.value.username,
          { limit: 2 },
        );
        assertEquals(limited.result, [
          mockUser3.username,
          mockUser2.username,
        ]);
      });
    },
  );
});
