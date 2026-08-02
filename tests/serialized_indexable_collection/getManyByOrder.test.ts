import {
  mockUser1,
  mockUser2,
  mockUser3,
  mockUsersWithAlteredAge,
} from "../mocks.ts";
import { assert, assertEquals } from "@std/assert";
import { useDb } from "../utils.ts";

Deno.test("serialized_indexable_collection - getManyByOrder", async (t) => {
  await t.step("Should get all documents by index order", async () => {
    await useDb(async (db) => {
      const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
      assert(cr.ok);

      const { result } = await db.is_users.getManyByOrder("age");
      assertEquals(result.length, mockUsersWithAlteredAge.length);
      assertEquals(result[0].value.username, mockUser3.username);
      assertEquals(result[1].value.username, mockUser1.username);
      assertEquals(result[2].value.username, mockUser2.username);
    });
  });

  await t.step(
    "Should get many by index order with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_multi_part_id_users.addMany(
          mockUsersWithAlteredAge,
        );
        assert(cr.ok);

        const { result } = await db.is_multi_part_id_users
          .getManyByOrder("age");
        assertEquals(result.length, mockUsersWithAlteredAge.length);
      });
    },
  );

  await t.step(
    "Should get documents by index order bounded by start and end values",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        // startValue is inclusive
        const start = await db.is_users.getManyByOrder("age", {
          startValue: 50,
        });
        assertEquals(start.result.length, 2);
        assertEquals(start.result[0].value.username, mockUser1.username);
        assertEquals(start.result[1].value.username, mockUser2.username);

        // endValue is exclusive
        const end = await db.is_users.getManyByOrder("age", {
          endValue: 80,
        });
        assertEquals(end.result.length, 2);
        assertEquals(end.result[0].value.username, mockUser3.username);
        assertEquals(end.result[1].value.username, mockUser1.username);

        // Combined start and end bounds
        const range = await db.is_users.getManyByOrder("age", {
          startValue: 50,
          endValue: 80,
        });
        assertEquals(range.result.length, 1);
        assertEquals(range.result[0].value.username, mockUser1.username);
      });
    },
  );

  await t.step(
    "Should get all documents by primary index order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const { result } = await db.is_users.getManyByOrder("username");
        assertEquals(result.length, mockUsersWithAlteredAge.length);
      });
    },
  );

  await t.step(
    "Should get documents by primary index order with limit",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const { result } = await db.is_users.getManyByOrder("username");
        const order = result.map((doc) => doc.value.username);

        const limited = await db.is_users.getManyByOrder("username", {
          limit: 2,
        });
        assertEquals(
          limited.result.map((doc) => doc.value.username),
          order.slice(0, 2),
        );
      });
    },
  );

  await t.step(
    "Should get documents by primary index order bounded by start and end values",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const { result } = await db.is_users.getManyByOrder("username");
        const order = result.map((doc) => doc.value.username);

        const start = await db.is_users.getManyByOrder("username", {
          startValue: order[1],
        });
        assertEquals(
          start.result.map((doc) => doc.value.username),
          order.slice(1),
        );

        const end = await db.is_users.getManyByOrder("username", {
          endValue: order[1],
        });
        assertEquals(
          end.result.map((doc) => doc.value.username),
          order.slice(0, 1),
        );
      });
    },
  );
});
