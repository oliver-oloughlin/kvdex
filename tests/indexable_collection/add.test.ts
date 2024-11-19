import { assert } from "@std/assert";
import { mockUser1, mockUserInvalid } from "../mocks.ts";
import { useDb } from "../utils.ts";

Deno.test("indexable_collection - add", async (t) => {
  await t.step("Should add new document entry to collection", async () => {
    await useDb(async (db) => {
      const cr = await db.i_users.add(mockUser1);
      assert(cr.ok);

      const doc = await db.i_users.find(cr.id);
      assert(doc !== null);
      assert(doc.value.username === mockUser1.username);
    });
  });

  await t.step(
    "Should not add new document with colliding primary index",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.i_users.add(mockUser1);
        const cr2 = await db.i_users.add(mockUser1);
        const count = await db.i_users.count();
        assert(cr1.ok);
        assert(!cr2.ok);
        assert(count === 1);
      });
    },
  );

  await t.step(
    "Should successfully parse and add new document entry to collection",
    async () => {
      await useDb(async (db) => {
        const cr = await db.zi_users.add(mockUser1);
        assert(cr.ok);

        const doc = await db.zi_users.find(cr.id);
        assert(doc !== null);
        assert(doc.value.username === mockUser1.username);
      });
    },
  );

  await t.step(
    "Should fail parse and add new document entry to collection",
    async () => {
      await useDb(async (db) => {
        let assertion = false;
        await db.zi_users.add(mockUserInvalid).catch(() => assertion = true);
        assert(assertion);
      });
    },
  );
});
