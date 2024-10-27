import { assert } from "../test.deps.ts";
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts";
import { generateUsers, sleep, useDb } from "../utils.ts";
import type { User } from "../models.ts";
import type { Document } from "../../mod.ts";

Deno.test("indexable_collection - watchMany", async (t) => {
  await t.step("Should receive all document updates", async () => {
    await useDb(async (db) => {
      const id1 = "id1";
      const id2 = "id2";
      const id3 = "id3";
      const generatedUser = generateUsers(1)[0];
      const snapshots: (Document<User, string> | null)[][] = [];

      await db.i_users.set(id3, generatedUser);

      await sleep(500);

      const { promise, cancel } = db.i_users.watchMany(
        [id1, id2, id3],
        (docs) => {
          snapshots.push(docs);
        },
      );

      const cr1 = await db.i_users.set(id1, mockUser1);
      await sleep(500);
      await db.i_users.delete(id1);
      await sleep(500);
      const cr2 = await db.i_users.set(id2, mockUser2, { overwrite: true });
      await sleep(500);
      const cr3 = await db.i_users.update(id3, mockUser3);
      await sleep(500);

      assert(cr1.ok);
      assert(cr2.ok);
      assert(cr3.ok);

      assert(snapshots.some((docs) => {
        const doc1 = docs.find((doc) => doc?.id === id1) ?? null;
        const doc2 = docs.find((doc) => doc?.id === id2) ?? null;
        const doc3 = docs.find((doc) => doc?.id === id3) ?? null;

        return doc1?.value.username === mockUser1.username &&
          doc2 === null &&
          doc3?.value.username === generatedUser.username;
      }));

      assert(snapshots.some((docs) => {
        const doc1 = docs.find((doc) => doc?.id === id1) ?? null;
        const doc2 = docs.find((doc) => doc?.id === id2) ?? null;
        const doc3 = docs.find((doc) => doc?.id === id3) ?? null;

        return doc1 === null &&
          doc2 === null &&
          doc3?.value.username === generatedUser.username;
      }));

      assert(snapshots.some((docs) => {
        const doc1 = docs.find((doc) => doc?.id === id1) ?? null;
        const doc2 = docs.find((doc) => doc?.id === id2) ?? null;
        const doc3 = docs.find((doc) => doc?.id === id3) ?? null;

        return doc1 === null &&
          doc2?.value.username === mockUser2.username &&
          doc3?.value.username === generatedUser.username;
      }));

      assert(snapshots.some((docs) => {
        const doc1 = docs.find((doc) => doc?.id === id1) ?? null;
        const doc2 = docs.find((doc) => doc?.id === id2) ?? null;
        const doc3 = docs.find((doc) => doc?.id === id3) ?? null;

        return doc1 === null &&
          doc2?.value.username === mockUser2.username &&
          doc3?.value.username === mockUser3.username;
      }));

      await cancel();
      await promise;
    });
  });

  await t.step("Should not receive unrelated document updates", async () => {
    await useDb(async (db) => {
      const id1 = "id1";
      const id2 = "id1";
      const id3 = "id1";
      const id4 = "id4";
      let count = 0;
      let lastDocs: any[] = [];

      const { promise, cancel } = db.i_users.watchMany(
        [id1, id2, id3],
        (docs) => {
          count++;
          lastDocs = docs;
        },
      );

      await db.i_users.set(id4, mockUser1);
      await sleep(500);
      await db.i_users.set(id4, mockUser2, { overwrite: true });
      await sleep(500);
      await db.i_users.update(id4, mockUser3);
      await sleep(500);
      await db.i_users.delete(id4);
      await sleep(500);

      assert(count === 1);
      assert(lastDocs[0] === null);
      assert(lastDocs[1] === null);
      assert(lastDocs[2] === null);

      await cancel();
      await promise;
    });
  });
});
