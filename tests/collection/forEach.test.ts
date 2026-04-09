import type { Document } from "../../mod.ts";
import { assert, assertEquals } from "@std/assert";
import type { User } from "../models.ts";
import { generateUsers } from "../utils.ts";
import { useDb } from "../utils.ts";

Deno.test("collection - forEach", async (t) => {
  await t.step(
    "Should run callback function for each document in the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000);
        const cr = await db.users.addMany(users);
        assert(cr.ok);

        const docs: Document<User, string>[] = [];
        await db.users.forEach((doc) => docs.push(doc));

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
        const cr = await db.multi_part_id_nums.addMany(values);
        assert(cr.ok);

        const docs: Array<{ value: number }> = [];
        await db.multi_part_id_nums.forEach((doc) =>
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
