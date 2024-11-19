import { assert } from "@std/assert";
import { mockUserInvalid } from "../mocks.ts";
import { generateLargeUsers, useDb } from "../utils.ts";

const [user] = generateLargeUsers(1);

Deno.test("serialized_indexable_collection - add", async (t) => {
  await t.step("Should add new document entry to collection", async () => {
    await useDb(async (db) => {
      const cr = await db.is_users.add(user);
      assert(cr.ok);

      const doc = await db.is_users.find(cr.id);
      assert(doc !== null);
      assert(doc.value.username === user.username);
    });
  });

  await t.step(
    "Should not add new document with colliding primary index",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.is_users.add(user);
        const cr2 = await db.is_users.add(user);
        const count = await db.is_users.count();
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
        const cr = await db.zis_users.add(user);
        assert(cr.ok);

        const doc = await db.zis_users.find(cr.id);
        assert(doc !== null);
        assert(doc.value.username === user.username);
      });
    },
  );

  await t.step(
    "Should fail parse and add new document entry to collection",
    async () => {
      await useDb(async (db) => {
        let assertion = false;
        await db.zis_users.add(mockUserInvalid).catch(() => assertion = true);
        assert(assertion);
      });
    },
  );
});
