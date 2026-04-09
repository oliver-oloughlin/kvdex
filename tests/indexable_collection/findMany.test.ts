import { assert } from "@std/assert";
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts";
import { generateUsers, useDb } from "../utils.ts";

Deno.test("indexable_collection - findMany", async (t) => {
  await t.step("Should find all documents", async () => {
    await useDb(async (db) => {
      const users = generateUsers(1_000);
      const cr = await db.i_users.addMany(users);
      assert(cr.ok);

      const { result: docs } = await db.i_users.getMany();

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
      const users = generateUsers(10);
      const cr = await db.i_users.addMany(users);
      assert(cr.ok);

      const docs = await db.i_users.findMany(["", "", ""]);
      assert(docs.length === 0);
    });
  });

  await t.step("Should find many documents by multi-part ids", async () => {
    await useDb(async (db) => {
      const users = [mockUser1, mockUser2, mockUser3];
      const cr = await db.i_multi_part_id_users.addMany(users);
      assert(cr.ok);

      const { result: ids } = await db.i_multi_part_id_users.map((doc) =>
        doc.id
      );
      const docs = await db.i_multi_part_id_users.findMany(ids);
      assert(docs.length === users.length);
      assert(
        users.every((user) =>
          docs.some((doc) => doc.value.username === user.username)
        ),
      );
    });
  });
});
