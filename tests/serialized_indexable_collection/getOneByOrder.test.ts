import { assert, assertEquals } from "@std/assert";
import { useDb } from "../utils.ts";
import { mockUser1, mockUser3, mockUsersWithAlteredAge } from "../mocks.ts";

Deno.test("serialized_indexable_collection - getOneByOrder", async (t) => {
  await t.step("Should get only one document by index order", async () => {
    await useDb(async (db) => {
      const cr = await db.is_users.addMany(mockUsersWithAlteredAge);

      assert(cr.ok);

      const doc = await db.is_users.getOneByOrder("age");
      assert(doc !== null);
      assertEquals(doc.value.username, mockUser3.username);
    });
  });

  await t.step(
    "Should get one by index order with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_multi_part_id_users.addMany(
          mockUsersWithAlteredAge,
        );
        assert(cr.ok);

        const doc = await db.is_multi_part_id_users.getOneByOrder(
          "age",
        );
        assert(doc !== null);
      });
    },
  );

  await t.step(
    "Should get one document by index order bounded by start and end values",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        // startValue is inclusive, returns first document from the bound
        const start = await db.is_users.getOneByOrder("age", {
          startValue: 50,
        });
        assert(start !== null);
        assertEquals(start.value.username, mockUser1.username);

        // endValue is exclusive, returns first document before the bound
        const end = await db.is_users.getOneByOrder("age", {
          endValue: 50,
        });
        assert(end !== null);
        assertEquals(end.value.username, mockUser3.username);
      });
    },
  );

  await t.step(
    "Should get first document by primary index order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const { result } = await db.is_users.getManyByOrder("username");
        const doc = await db.is_users.getOneByOrder("username");
        assert(doc !== null);
        assertEquals(doc.value.username, result[0].value.username);
      });
    },
  );

  await t.step(
    "Should get one document by primary index order bounded by start and end values",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const { result } = await db.is_users.getManyByOrder("username");
        const order = result.map((doc) => doc.value.username);

        const start = await db.is_users.getOneByOrder("username", {
          startValue: order[1],
        });
        assert(start !== null);
        assertEquals(start.value.username, order[1]);

        const end = await db.is_users.getOneByOrder("username", {
          endValue: order[1],
        });
        assert(end !== null);
        assertEquals(end.value.username, order[0]);
      });
    },
  );
});
