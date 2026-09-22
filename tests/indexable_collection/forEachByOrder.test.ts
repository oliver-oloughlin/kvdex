import type { Document } from "../../mod.ts";
import { assert, assertEquals } from "@std/assert";
import {
  mockUser1,
  mockUser2,
  mockUser3,
  mockUsersWithAlteredAge,
} from "../mocks.ts";
import type { User } from "../models.ts";
import { useDb } from "../utils.ts";

Deno.test("indexable_collection - forEachByOrder", async (t) => {
  await t.step(
    "Should run callback function for each document in the collection by index order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const docs: Document<User, string>[] = [];
        await db.i_users.forEachByOrder(
          "age",
          (doc) => docs.push(doc),
        );

        assertEquals(docs[0].value.username, mockUser3.username);
        assertEquals(docs[1].value.username, mockUser1.username);
        assertEquals(docs[2].value.username, mockUser2.username);
      });
    },
  );

  await t.step(
    "Should forEach by index order with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_multi_part_id_users.addMany(
          mockUsersWithAlteredAge,
        );
        assert(cr.ok);

        const docs: string[] = [];
        await db.i_multi_part_id_users.forEachByOrder(
          "age",
          (doc) => {
            docs.push(doc.value.username);
          },
        );

        assertEquals(docs.length, mockUsersWithAlteredAge.length);
      });
    },
  );

  await t.step(
    "Should run callback for each document bounded by start and end values",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        // startValue is inclusive
        const startDocs: Document<User, string>[] = [];
        await db.i_users.forEachByOrder(
          "age",
          (doc) => startDocs.push(doc),
          { startValue: 50 },
        );
        assertEquals(startDocs.length, 2);
        assertEquals(startDocs[0].value.username, mockUser1.username);
        assertEquals(startDocs[1].value.username, mockUser2.username);

        // endValue is exclusive
        const endDocs: Document<User, string>[] = [];
        await db.i_users.forEachByOrder(
          "age",
          (doc) => endDocs.push(doc),
          { endValue: 80 },
        );
        assertEquals(endDocs.length, 2);
        assertEquals(endDocs[0].value.username, mockUser3.username);
        assertEquals(endDocs[1].value.username, mockUser1.username);
      });
    },
  );

  await t.step(
    "Should run callback for each document by primary index order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const usernames: string[] = [];
        await db.i_users.forEachByOrder(
          "username",
          (doc) => usernames.push(doc.value.username),
        );
        assertEquals(usernames, [
          mockUser3.username,
          mockUser2.username,
          mockUser1.username,
        ]);
      });
    },
  );

  await t.step(
    "Should run callback for each document by primary index order with limit",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const limited: string[] = [];
        await db.i_users.forEachByOrder(
          "username",
          (doc) => limited.push(doc.value.username),
          { limit: 2 },
        );
        assertEquals(limited, [mockUser3.username, mockUser2.username]);
      });
    },
  );
});
