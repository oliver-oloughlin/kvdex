import {
  mockUser1,
  mockUser2,
  mockUser3,
  mockUsersWithAlteredAge,
} from "../mocks.ts";
import { assert } from "@std/assert";
import { useDb } from "../utils.ts";

Deno.test("indexable_collection - getManyBySecondaryOrder", async (t) => {
  await t.step("Should get all documents by secondary order", async () => {
    await useDb(async (db) => {
      const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
      assert(cr.ok);

      const { result } = await db.i_users.getManyBySecondaryOrder("age");
      assert(result.length === mockUsersWithAlteredAge.length);
      assert(result[0].value.username === mockUser3.username);
      assert(result[1].value.username === mockUser1.username);
      assert(result[2].value.username === mockUser2.username);
    });
  });

  await t.step(
    "Should get many by secondary order with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_multi_part_id_users.addMany(
          mockUsersWithAlteredAge,
        );
        assert(cr.ok);

        const { result } = await db.i_multi_part_id_users
          .getManyBySecondaryOrder("age");
        assert(result.length === mockUsersWithAlteredAge.length);
      });
    },
  );

  await t.step(
    "Should get documents by secondary order bounded by start and end values",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        // startValue is inclusive
        const start = await db.i_users.getManyBySecondaryOrder("age", {
          startValue: 50,
        });
        assert(start.result.length === 2);
        assert(start.result[0].value.username === mockUser1.username);
        assert(start.result[1].value.username === mockUser2.username);

        // endValue is exclusive
        const end = await db.i_users.getManyBySecondaryOrder("age", {
          endValue: 80,
        });
        assert(end.result.length === 2);
        assert(end.result[0].value.username === mockUser3.username);
        assert(end.result[1].value.username === mockUser1.username);

        // Combined start and end bounds
        const range = await db.i_users.getManyBySecondaryOrder("age", {
          startValue: 50,
          endValue: 80,
        });
        assert(range.result.length === 1);
        assert(range.result[0].value.username === mockUser1.username);
      });
    },
  );
});
