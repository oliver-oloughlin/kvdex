import type { Document } from "../../mod.ts";
import { assert } from "@std/assert";
import {
  mockUser1,
  mockUser2,
  mockUser3,
  mockUsersWithAlteredAge,
} from "../mocks.ts";
import type { User } from "../models.ts";
import { useDb } from "../utils.ts";

Deno.test("serialized_indexable_collection - forEachBySecondaryOrder", async (t) => {
  await t.step(
    "Should run callback function for each document in the collection by secondary order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const docs: Document<User, string>[] = [];
        await db.is_users.forEachBySecondaryOrder(
          "age",
          (doc) => docs.push(doc),
        );

        assert(docs[0].value.username === mockUser3.username);
        assert(docs[1].value.username === mockUser1.username);
        assert(docs[2].value.username === mockUser2.username);
      });
    },
  );

  await t.step(
    "Should forEach by secondary order with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_multi_part_id_users.addMany(
          mockUsersWithAlteredAge,
        );
        assert(cr.ok);

        const docs: string[] = [];
        await db.is_multi_part_id_users.forEachBySecondaryOrder(
          "age",
          (doc) => {
            docs.push(doc.value.username);
          },
        );

        assert(docs.length === mockUsersWithAlteredAge.length);
      });
    },
  );

  await t.step(
    "Should run callback for each document bounded by start and end values",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        // startValue is inclusive
        const startDocs: Document<User, string>[] = [];
        await db.is_users.forEachBySecondaryOrder(
          "age",
          (doc) => startDocs.push(doc),
          { startValue: 50 },
        );
        assert(startDocs.length === 2);
        assert(startDocs[0].value.username === mockUser1.username);
        assert(startDocs[1].value.username === mockUser2.username);

        // endValue is exclusive
        const endDocs: Document<User, string>[] = [];
        await db.is_users.forEachBySecondaryOrder(
          "age",
          (doc) => endDocs.push(doc),
          { endValue: 80 },
        );
        assert(endDocs.length === 2);
        assert(endDocs[0].value.username === mockUser3.username);
        assert(endDocs[1].value.username === mockUser1.username);
      });
    },
  );
});
