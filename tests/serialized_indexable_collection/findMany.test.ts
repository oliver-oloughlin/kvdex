import { assert } from "@std/assert";
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts";
import { generateLargeUsers, useDb } from "../utils.ts";

Deno.test("serialized_indexable_collection - findMany", async (t) => {
  await t.step("Should find all documents", async () => {
    await useDb(async (db) => {
      const users = generateLargeUsers(100);
      const cr = await db.is_users.addMany(users);
      assert(cr.ok);

      const { result: docs } = await db.is_users.getMany();

      assert(docs.length === users.length);
      assert(
        users.every((user) =>
          docs.some((doc) => doc.value.username === user.username)
        ),
      );
    });
  });

  await t.step("Should not find any documents", async () => {
    await useDb(async (db) => {
      const users = generateLargeUsers(10);
      const cr = await db.is_users.addMany(users);
      assert(cr.ok);

      const docs = await db.is_users.findMany(["", "", ""]);
      assert(docs.length === 0);
    });
  });

  await t.step("Should find many documents by multi-part ids", async () => {
    await useDb(async (db) => {
      const users = [mockUser1, mockUser2, mockUser3];
      const cr = await db.is_multi_part_id_users.addMany(users);
      assert(cr.ok);

      const { result: ids } = await db.is_multi_part_id_users.map((doc) =>
        doc.id
      );
      const docs = await db.is_multi_part_id_users.findMany(ids);
      assert(docs.length === users.length);
      assert(
        users.every((user) =>
          docs.some((doc) => doc.value.username === user.username)
        ),
      );
    });
  });
});
