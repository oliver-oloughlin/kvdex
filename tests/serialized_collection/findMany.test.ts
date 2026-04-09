import { assert, assertEquals } from "@std/assert";
import { generateLargeUsers, useDb } from "../utils.ts";

Deno.test("serialized_collection - findMany", async (t) => {
  await t.step("Should find all documents", async () => {
    await useDb(async (db) => {
      const users = generateLargeUsers(100);
      const cr = await db.s_users.addMany(users);
      assert(cr.ok);

      const { result: docs } = await db.s_users.getMany();

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
      const cr = await db.s_users.addMany(users);
      assert(cr.ok);

      const docs = await db.s_users.findMany(["", "", ""]);
      assert(docs.length === 0);
    });
  });

  await t.step("Should find many documents by multi-part ids", async () => {
    await useDb(async (db) => {
      const values = [1, 2, 3];
      const cr = await db.s_multi_part_id_nums.addMany(values);
      assert(cr.ok);

      const { result: ids } = await db.s_multi_part_id_nums.map((doc) =>
        doc.id
      );
      const docs = await db.s_multi_part_id_nums.findMany(ids);
      assertEquals(docs.length, values.length);
      assert(values.every((value) => docs.some((doc) => doc.value === value)));
    });
  });
});
