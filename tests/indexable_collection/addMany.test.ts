import { assert } from "@std/assert";
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts";
import { generateInvalidUsers, generateUsers, useDb } from "../utils.ts";

Deno.test("indexable_collection - addMany", async (t) => {
  await t.step(
    "Should successfully add 1000 documents to the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000);
        const cr = await db.i_users.addMany(users);
        assert(cr.ok);

        const { result } = await db.i_users.getMany();

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
        const cr = await db.i_users.addMany([mockUser1, mockUser1]);
        const count = await db.i_users.count();

        assert(!cr.ok);
        assert(count === 1);
      });
    },
  );

  await t.step(
    "Should successfully parse and add 1000 documents to the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000);
        const cr = await db.zi_users.addMany(users);
        assert(cr.ok);

        const { result } = await db.zi_users.getMany();

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

        await db.zi_users.addMany(users).catch(() => assertion = true);

        assert(assertion);
      });
    },
  );

  await t.step(
    "Should successfully add and find document in collection with multi-part id",
    async () => {
      await useDb(async (db) => {
        const users = [mockUser1, mockUser2, mockUser3];
        const cr = await db.i_multi_part_id_users.addMany(users);
        assert(cr.ok);

        const { result: docs } = await db.i_multi_part_id_users.getMany();
        assert(docs.length === users.length);
        assert(
          users.every((user) =>
            docs.some((doc) => doc.value.username === user.username)
          ),
        );
      });
    },
  );
});
