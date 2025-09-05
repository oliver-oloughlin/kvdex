import { assert } from "@std/assert";
import { generateInvalidUsers, generateLargeUsers, useDb } from "../utils.ts";

const [user] = generateLargeUsers(1);

Deno.test("serialized_indexable_collection - addMany", async (t) => {
  await t.step(
    "Should successfully add 1000 documents to the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(100);
        const cr = await db.is_users.addMany(users);
        assert(cr.ok);

        const { result } = await db.is_users.getMany();

        assert(result.length === users.length);
        assert(
          users.every((user) =>
            result.some((doc) => doc.value.username === user.username)
          ),
        );
      });
    },
  );

  await t.step(
    "Should not add documents with colliding primary indices",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany([user, user]);
        const count = await db.is_users.count();

        assert(!cr.ok);
        assert(count === 1);
      });
    },
  );

  await t.step(
    "Should successfully parse and add 1000 documents to the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(100);
        const cr = await db.zis_users.addMany(users);
        assert(cr.ok);

        const { result } = await db.zis_users.getMany();

        assert(result.length === users.length);
        assert(
          users.every((user) =>
            result.some((doc) => doc.value.username === user.username)
          ),
        );
      });
    },
  );

  await t.step(
    "Should fail to parse and add 1000 documents to the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateInvalidUsers(1_000);
        let assertion = false;

        await db.zis_users.addMany(users).catch(() => assertion = true);

        assert(assertion);
      });
    },
  );
});
