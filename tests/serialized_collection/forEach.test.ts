import type { Document } from "../../mod.ts";
import { assert, assertEquals } from "@std/assert";
import type { User } from "../models.ts";
import { generateLargeUsers, useDb } from "../utils.ts";

Deno.test("serialized_collection - forEach", async (t) => {
  await t.step(
    "Should run callback function for each document in the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(100);
        const cr = await db.s_users.addMany(users);
        assert(cr.ok);

        const docs: Document<User, string>[] = [];
        await db.s_users.forEach((doc) => docs.push(doc));

        assert(docs.length === users.length);
        assert(
          users.every((user) =>
            docs.some((doc) => doc.value.username === user.username)
          ),
        );
      });
    },
  );

  await t.step(
    "Should run callback function for each document with multi-part id",
    async () => {
      await useDb(async (db) => {
        const values = [1, 2, 3, 4, 5];
        const cr = await db.s_multi_part_id_nums.addMany(values);
        assert(cr.ok);

        const docs: Array<{ value: number }> = [];
        await db.s_multi_part_id_nums.forEach((doc) =>
          docs.push({
            value: doc.value,
          })
        );

        assertEquals(docs.length, values.length);
        assert(
          values.every((value) => docs.some((doc) => doc.value === value)),
        );
      });
    },
  );
});
