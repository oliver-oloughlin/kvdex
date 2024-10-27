import { assert } from "../test.deps.ts";
import { mockUserInvalid } from "../mocks.ts";
import { generateLargeUsers, useDb } from "../utils.ts";

const [user1, user2] = generateLargeUsers(2);

Deno.test("serialized_indexable_collection - set", async (t) => {
  await t.step("Should set new document entry in collection", async () => {
    await useDb(async (db) => {
      const cr = await db.is_users.set("id", user1);
      assert(cr.ok);

      const doc = await db.is_users.find(cr.id);
      assert(doc !== null);
      assert(doc.value.username === user1.username);
    });
  });

  await t.step(
    "Should not set new document entry in collection with colliding id",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.is_users.set("id", user1);
        assert(cr1.ok);

        const cr2 = await db.is_users.set("id", user2);
        assert(!cr2.ok);

        const doc = await db.is_users.find("id");
        assert(doc !== null);
        assert(doc.value.username === user1.username);
      });
    },
  );

  await t.step(
    "Should not set new document entry in collection with primary index",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.is_users.set("id1", user1);
        assert(cr1.ok);

        const cr2 = await db.is_users.set("id2", user1);
        assert(!cr2.ok);

        const byPrimary = await db.is_users.findByPrimaryIndex(
          "username",
          user1.username,
        );

        const bySecondary = await db.is_users.findBySecondaryIndex(
          "age",
          user1.age,
        );

        assert(byPrimary?.id === cr1.id);
        assert(bySecondary.result.length === 1);
      });
    },
  );

  await t.step(
    "Should overwrite document in collection with colliding id",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.is_users.set("id", user1);
        assert(cr1.ok);

        const cr2 = await db.is_users.set("id", user2, { overwrite: true });
        assert(cr2.ok);

        const doc = await db.is_users.find("id");
        assert(doc !== null);
        assert(doc.value.username === user2.username);
      });
    },
  );

  await t.step(
    "Should not overwrite document in collection with colliding primary index",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.is_users.set("id1", user1);
        assert(cr1.ok);

        const cr2 = await db.is_users.set("id2", user1, { overwrite: true });
        assert(!cr2.ok);

        const byPrimary = await db.is_users.findByPrimaryIndex(
          "username",
          user1.username,
        );

        const bySecondary = await db.is_users.findBySecondaryIndex(
          "age",
          user1.age,
        );

        assert(byPrimary?.id === cr1.id);
        assert(bySecondary.result.length === 1);
      });
    },
  );

  await t.step("Should successfully parse and set document", async () => {
    await useDb(async (db) => {
      let assertion = true;
      await db.zis_users.set("id", user1).catch(() => assertion = false);
      assert(assertion);
    });
  });

  await t.step("Should fail to parse and set document", async () => {
    await useDb(async (db) => {
      let assertion = false;
      await db.zis_users.set("id", mockUserInvalid).catch(() =>
        assertion = true
      );
      assert(assertion);
    });
  });
});
