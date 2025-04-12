import { assert } from "@std/assert";
import { mockUser1 } from "../mocks.ts";
import { TransformUserModel } from "../models.ts";
import { useDb } from "../utils.ts";
import { parse } from "../../src/utils.ts";

Deno.test("indexable_collection - findByPrimaryIndex", async (t) => {
  await t.step("Should find document by primary index", async () => {
    await useDb(async (db) => {
      const id = "id";

      const cr = await db.i_users.set(id, mockUser1);
      assert(cr.ok);

      const doc = await db.i_users.findByPrimaryIndex(
        "username",
        mockUser1.username,
      );
      assert(doc !== null);
      assert(doc.value.username === mockUser1.username);
    });
  });

  await t.step("Should not find document by non-existing index", async () => {
    await useDb(async (db) => {
      const doc = await db.i_users.findByPrimaryIndex(
        "username",
        mockUser1.username,
      );
      assert(doc === null);
    });
  });

  await t.step(
    "Should find document by asymmetric model primary index",
    async () => {
      await useDb(async (db) => {
        const transformed = await parse(TransformUserModel, mockUser1);

        const cr = await db.ai_users.add(mockUser1);
        assert(cr.ok);

        const doc = await db.ai_users.findByPrimaryIndex(
          "name",
          transformed.name,
        );
        assert(doc?.value.name === transformed.name);
      });
    },
  );
});
