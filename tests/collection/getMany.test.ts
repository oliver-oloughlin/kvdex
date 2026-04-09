import { assert, assertEquals } from "@std/assert";
import { generateUsers, useDb } from "../utils.ts";

Deno.test("collection - getMany", async (t) => {
  await t.step("Should get all documents", async () => {
    await useDb(async (db) => {
      const users = generateUsers(1_000);
      const cr = await db.users.addMany(users);
      assert(cr.ok);

      const { result } = await db.users.getMany();
      assert(result.length === users.length);
      assert(
        users.every((user) =>
          result.some((doc) => doc.value.username === user.username)
        ),
      );
    });
  });

  await t.step("Should get all documents with multi-part id", async () => {
    await useDb(async (db) => {
      const values = [1, 2, 3, 4, 5];
      const cr = await db.multi_part_id_nums.addMany(values);
      assert(cr.ok);

      const { result } = await db.multi_part_id_nums.getMany();
      assertEquals(result.length, values.length);
      assert(
        values.every((value) => result.some((doc) => doc.value === value)),
      );
    });
  });
});
