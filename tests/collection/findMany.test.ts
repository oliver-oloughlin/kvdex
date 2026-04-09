import { assert, assertEquals } from "@std/assert";
import { generateUsers, useDb } from "../utils.ts";

Deno.test("collection - findMany", async (t) => {
  await t.step("Should find all documents", async () => {
    await useDb(async (db) => {
      const users = generateUsers(1_000);
      const cr = await db.users.addMany(users);
      assert(cr.ok);

      const { result: ids } = await db.users.map((doc) => doc.id);
      const docs = await db.users.findMany(ids);
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
      const cr = await db.users.addMany(users);
      assert(cr.ok);

      const docs = await db.users.findMany(["", "", ""]);
      assert(docs.length === 0);
    });
  });

  await t.step("Should find many documents by multi-part ids", async () => {
    await useDb(async (db) => {
      const values = [1, 2, 3];
      const cr = await db.multi_part_id_nums.addMany(values);
      assert(cr.ok);

      const { result: ids } = await db.multi_part_id_nums.map((doc) => doc.id);
      const docs = await db.multi_part_id_nums.findMany(ids);
      assertEquals(docs.length, values.length);
      assert(values.every((value) => docs.some((doc) => doc.value === value)));
    });
  });
});
