import type { Document } from "../../mod.ts";
import { assert } from "@std/assert";
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts";
import type { User } from "../models.ts";
import { generateLargeUsers, useDb } from "../utils.ts";

Deno.test("serialized_indexable_collection - forEach", async (t) => {
  await t.step(
    "Should run callback function for each document in the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(100);
        const cr = await db.is_users.addMany(users);
        assert(cr.ok);

        const docs: Document<User, string>[] = [];
        await db.is_users.forEach((doc) => docs.push(doc));

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
        const users = [mockUser1, mockUser2, mockUser3];
        const cr = await db.is_multi_part_id_users.addMany(users);
        assert(cr.ok);

        const docs: Array<{ username: string }> = [];
        await db.is_multi_part_id_users.forEach((doc) =>
          docs.push({ username: doc.value.username })
        );

        assert(docs.length === users.length);
        assert(
          users.every((user) =>
            docs.some((doc) => doc.username === user.username)
          ),
        );
      });
    },
  );
});
