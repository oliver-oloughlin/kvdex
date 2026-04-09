import { assert } from "@std/assert";
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts";
import { generateUsers, sleep, useDb } from "../utils.ts";
import type { Document } from "../../mod.ts";
import type { User } from "../models.ts";
import { keyEq } from "../../src/core/utils.ts";

Deno.test("serialized_indexable_collection - watchMany", async (t) => {
  await t.step("Should receive all document updates", async () => {
    await useDb(async (db) => {
      const id1 = "id1";
      const id2 = "id2";
      const id3 = "id3";
      const generatedUser = generateUsers(1)[0];
      const snapshots: (Document<User, string> | null)[][] = [];

      await db.is_users.set(id3, generatedUser);

      await sleep(500);

      const watcher = db.is_users.watchMany([id1, id2, id3], (docs) => {
        snapshots.push(docs);
      });

      const cr1 = await db.is_users.set(id1, mockUser1);
      await sleep(500);
      await db.is_users.delete(id1);
      await sleep(500);
      const cr2 = await db.is_users.set(id2, mockUser2, { overwrite: true });
      await sleep(500);
      const cr3 = await db.is_users.update(id3, mockUser3);
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

      return async () => await watcher;
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

      const watcher = db.is_users.watchMany([id1, id2, id3], (docs) => {
        count++;
        lastDocs = docs;
      });

      await db.is_users.set(id4, mockUser1);
      await sleep(500);
      await db.is_users.set(id4, mockUser2, { overwrite: true });
      await sleep(500);
      await db.is_users.update(id4, mockUser3);
      await sleep(500);
      await db.is_users.delete(id4);
      await sleep(500);

      assert(count === 1);
      assert(lastDocs[0] === null);
      assert(lastDocs[1] === null);
      assert(lastDocs[2] === null);

      return async () => await watcher;
    });
  });

  await t.step(
    "Should receive all document updates for multi-part ids",
    async () => {
      await useDb(async (db) => {
        const id1: [string, number] = ["id1", 1];
        const id2: [string, number] = ["id2", 2];
        const id3: [string, number] = ["id3", 3];
        const updatedUser3: User = { ...mockUser3, age: 50 };
        const snapshots: (Document<User, [string, number]> | null)[][] = [];

        await db.is_multi_part_id_users.set(id3, mockUser3);

        const { promise, cancel } = db.is_multi_part_id_users.watchMany(
          [id1, id2, id3],
          (docs) => {
            snapshots.push(
              docs as (Document<User, [string, number]> | null)[],
            );
          },
        );

        const cr1 = await db.is_multi_part_id_users.set(id1, mockUser1);
        await sleep(500);
        await db.is_multi_part_id_users.delete(id1);
        await sleep(500);
        const cr2 = await db.is_multi_part_id_users.set(id2, mockUser2);
        await sleep(500);
        const cr3 = await db.is_multi_part_id_users.update(id3, {
          age: updatedUser3.age,
        });
        await sleep(500);

        assert(cr1.ok);
        assert(cr2.ok);
        assert(cr3.ok);

        const getSnapshot = (
          docs: (Document<User, [string, number]> | null)[],
        ) => {
          const doc1 = docs.find((doc) => doc !== null && keyEq(doc.id, id1)) ??
            null;
          const doc2 = docs.find((doc) => doc !== null && keyEq(doc.id, id2)) ??
            null;
          const doc3 = docs.find((doc) => doc !== null && keyEq(doc.id, id3)) ??
            null;

          return [doc1, doc2, doc3] as const;
        };

        assert(snapshots.some((docs) => {
          const [doc1, doc2, doc3] = getSnapshot(docs);
          return doc1?.value.username === mockUser1.username &&
            doc2 === null &&
            doc3?.value.username === mockUser3.username;
        }));

        assert(snapshots.some((docs) => {
          const [doc1, doc2, doc3] = getSnapshot(docs);
          return doc1 === null &&
            doc2 === null &&
            doc3?.value.username === mockUser3.username;
        }));

        assert(snapshots.some((docs) => {
          const [doc1, doc2, doc3] = getSnapshot(docs);
          return doc1 === null &&
            doc2?.value.username === mockUser2.username &&
            doc3?.value.username === mockUser3.username;
        }));

        assert(snapshots.some((docs) => {
          const [doc1, doc2, doc3] = getSnapshot(docs);
          return doc1 === null &&
            doc2?.value.username === mockUser2.username &&
            doc3?.value.age === updatedUser3.age;
        }));

        await cancel();
        await promise;
      });
    },
  );

  await t.step(
    "Should not receive unrelated document updates for multi-part ids",
    async () => {
      await useDb(async (db) => {
        const id1: [string, number] = ["id1", 1];
        const id2: [string, number] = ["id2", 2];
        const id3: [string, number] = ["id3", 3];
        const id4: [string, number] = ["id4", 4];
        let count = 0;
        let lastDocs: any[] = [];

        const { promise, cancel } = db.is_multi_part_id_users.watchMany(
          [id1, id2, id3],
          (docs) => {
            count++;
            lastDocs = docs;
          },
        );

        await db.is_multi_part_id_users.set(id4, mockUser1);
        await sleep(500);
        await db.is_multi_part_id_users.set(id4, mockUser2, {
          overwrite: true,
        });
        await sleep(500);
        await db.is_multi_part_id_users.update(id4, mockUser3);
        await sleep(500);
        await db.is_multi_part_id_users.delete(id4);
        await sleep(500);

        assert(count === 1);
        assert(lastDocs[0] === null);
        assert(lastDocs[1] === null);
        assert(lastDocs[2] === null);

        await cancel();
        await promise;
      });
    },
  );
});
