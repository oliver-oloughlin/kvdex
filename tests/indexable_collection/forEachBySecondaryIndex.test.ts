import type { Document } from "../../mod.ts";
import { assert } from "@std/assert";
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts";
import type { User } from "../models.ts";
import { useDb } from "../utils.ts";

Deno.test("indexable_collection - forEachBySecondaryIndex", async (t) => {
  await t.step(
    "Should run callback function for each document in the collection by secondary index",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany([mockUser1, mockUser2, mockUser3]);
        assert(cr.ok);

        const docs: Document<User, string>[] = [];
        await db.i_users.forEachBySecondaryIndex(
          "age",
          mockUser1.age,
          (doc) => docs.push(doc),
        );

        assert(docs.length === 2);
        assert(docs.some((doc) => doc.value.username === mockUser1.username));
        assert(docs.some((doc) => doc.value.username === mockUser2.username));
        assert(!docs.some((doc) => doc.value.username === mockUser3.username));
      });
    },
  );

  await t.step(
    "Should forEach by secondary index with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.i_multi_part_id_users.add(mockUser1);
        const cr2 = await db.i_multi_part_id_users.add(mockUser2);
        assert(cr1.ok && cr2.ok);

        const docs: string[] = [];
        await db.i_multi_part_id_users.forEachBySecondaryIndex(
          "age",
          mockUser1.age,
          (doc) => {
            docs.push(doc.value.username);
          },
        );

        assert(docs.length === 2);
        assert(docs.includes(mockUser1.username));
        assert(docs.includes(mockUser2.username));
      });
    },
  );
});
