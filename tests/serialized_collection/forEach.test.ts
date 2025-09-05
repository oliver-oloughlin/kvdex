import type { Document } from "../../mod.ts";
import { assert } from "@std/assert";
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
});
