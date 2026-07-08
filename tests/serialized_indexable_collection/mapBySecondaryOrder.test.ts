import { assert } from "@std/assert";
import {
  mockUser1,
  mockUser2,
  mockUser3,
  mockUsersWithAlteredAge,
} from "../mocks.ts";
import { useDb } from "../utils.ts";

Deno.test("serialized_indexable_collection - mapBySecondaryOrder", async (t) => {
  await t.step(
    "Should run callback mapper function for each document in the collection by secondary order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const { result } = await db.is_users.mapBySecondaryOrder(
          "age",
          (doc) => doc.value.username,
        );

        assert(result[0] === mockUser3.username);
        assert(result[1] === mockUser1.username);
        assert(result[2] === mockUser2.username);
      });
    },
  );

  await t.step(
    "Should map by secondary order with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_multi_part_id_users.addMany(
          mockUsersWithAlteredAge,
        );
        assert(cr.ok);

        const { result } = await db.is_multi_part_id_users.mapBySecondaryOrder(
          "age",
          (doc) => doc.value.username,
        );

        assert(result.length === mockUsersWithAlteredAge.length);
      });
    },
  );

  await t.step(
    "Should map documents bounded by start and end values",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        // startValue is inclusive
        const start = await db.is_users.mapBySecondaryOrder(
          "age",
          (doc) => doc.value.username,
          { startValue: 50 },
        );
        assert(start.result.length === 2);
        assert(start.result[0] === mockUser1.username);
        assert(start.result[1] === mockUser2.username);

        // endValue is exclusive
        const end = await db.is_users.mapBySecondaryOrder(
          "age",
          (doc) => doc.value.username,
          { endValue: 80 },
        );
        assert(end.result.length === 2);
        assert(end.result[0] === mockUser3.username);
        assert(end.result[1] === mockUser1.username);
      });
    },
  );
});
