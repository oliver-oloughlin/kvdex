import { assert } from "@std/assert";
import { generateLargeUsers, useDb } from "../utils.ts";
import { validate } from "../../src/utils.ts";
import { TransformUserModel } from "../models.ts";

const [user] = generateLargeUsers(1);

Deno.test("serialized_indexable_collection - findByPrimaryIndex", async (t) => {
  await t.step("Should find document by primary index", async () => {
    await useDb(async (db) => {
      const id = "id";

      const cr = await db.is_users.set(id, user);
      assert(cr.ok);

      const doc = await db.is_users.findByPrimaryIndex(
        "username",
        user.username,
      );

      assert(doc !== null);
      assert(doc.value.username === user.username);
    });
  });

  await t.step("Should not find document by non-existing index", async () => {
    await useDb(async (db) => {
      const doc = await db.is_users.findByPrimaryIndex(
        "username",
        user.username,
      );
      assert(doc === null);
    });
  });

  await t.step(
    "Should find document by asymmetric model primary index",
    async () => {
      await useDb(async (db) => {
        const transformed = await validate(TransformUserModel, user);

        const cr = await db.ais_users.add(user);
        assert(cr.ok);

        const doc = await db.ais_users.findByPrimaryIndex(
          "name",
          transformed.name,
        );
        assert(doc?.value.name === transformed.name);
      });
    },
  );
});
