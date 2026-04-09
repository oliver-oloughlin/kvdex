import { assert, assertEquals } from "@std/assert";
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts";
import { sleep, useDb } from "../utils.ts";
import type { Document } from "../../mod.ts";
import type { User } from "../models.ts";
import { keyEq } from "../../src/core/utils.ts";

Deno.test("collection - watchMany", async (t) => {
  await t.step("Should receive all document updates", async () => {
    await useDb(async (db) => {
      const id1 = "id1";
      const id2 = "id2";
      const id3 = "id3";
      const snapshots: (Document<User, string> | null)[][] = [];

      await db.users.set(id3, mockUser1);

      const { promise, cancel } = db.users.watchMany(
        [id1, id2, id3],
        (docs) => {
          snapshots.push(docs);
        },
      );

      const cr1 = await db.users.set(id1, mockUser1);
      await sleep(500);
      await db.users.delete(id1);
      await sleep(500);
      const cr2 = await db.users.set(id2, mockUser2);
      await sleep(500);
      const cr3 = await db.users.update(id3, mockUser3);
      await sleep(500);

      assert(cr1.ok);
      assert(cr2.ok);
      assert(cr3.ok);

      const getSnapshot = (docs: (Document<User, string> | null)[]) => {
        const doc1 = docs.find((doc) => doc?.id === id1) ?? null;
        const doc2 = docs.find((doc) => doc?.id === id2) ?? null;
        const doc3 = docs.find((doc) => doc?.id === id3) ?? null;
        return [doc1, doc2, doc3] as const;
      };

      assert(snapshots.some((docs) => {
        const [doc1, doc2, doc3] = getSnapshot(docs);

        return doc1?.value.username === mockUser1.username &&
          doc2 === null &&
          doc3?.value.username === mockUser1.username;
      }));

      assert(snapshots.some((docs) => {
        const [doc1, doc2, doc3] = getSnapshot(docs);

        return doc1 === null &&
          doc2 === null &&
          doc3?.value.username === mockUser1.username;
      }));

      assert(snapshots.some((docs) => {
        const [doc1, doc2, doc3] = getSnapshot(docs);

        return doc1 === null &&
          doc2?.value.username === mockUser2.username &&
          doc3?.value.username === mockUser1.username;
      }));

      assert(snapshots.some((docs) => {
        const [doc1, doc2, doc3] = getSnapshot(docs);

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
      const id2 = "id2";
      const id3 = "id3";
      const id4 = "id4";
      let count = 0;
      let lastDocs: any[] = [];

      const { promise, cancel } = db.users.watchMany(
        [id1, id2, id3],
        (docs) => {
          count++;
          lastDocs = docs;
        },
      );

      await db.users.set(id4, mockUser1);
      await sleep(500);
      await db.users.set(id4, mockUser2, { overwrite: true });
      await sleep(500);
      await db.users.update(id4, mockUser3);
      await sleep(500);
      await db.users.delete(id4);
      await sleep(500);

      assert(count === 1);
      assert(lastDocs[0] === null);
      assert(lastDocs[1] === null);
      assert(lastDocs[2] === null);

      await cancel();
      await promise;
    });
  });

  await t.step(
    "Should receive all document updates for multi-part ids",
    async () => {
      await useDb(async (db) => {
        const id1: [string, number] = ["id1", 1];
        const id2: [string, number] = ["id2", 2];
        const id3: [string, number] = ["id3", 3];
        const n1 = 10;
        const n2 = 20;
        const n3 = 30;
        const snapshots: (Document<number, [string, number]> | null)[][] = [];

        await db.multi_part_id_nums.set(id3, n1);

        const { promise, cancel } = db.multi_part_id_nums.watchMany(
          [id1, id2, id3],
          (docs) => {
            snapshots.push(
              docs as (Document<number, [string, number]> | null)[],
            );
          },
        );

        const cr1 = await db.multi_part_id_nums.set(id1, n1);
        await sleep(500);
        await db.multi_part_id_nums.delete(id1);
        await sleep(500);
        const cr2 = await db.multi_part_id_nums.set(id2, n2);
        await sleep(500);
        const cr3 = await db.multi_part_id_nums.update(id3, n3);
        await sleep(500);

        assert(cr1.ok);
        assert(cr2.ok);
        assert(cr3.ok);

        const getSnapshot = (
          docs: (Document<number, [string, number]> | null)[],
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
          return doc1?.value === n1 && doc2 === null && doc3?.value === n1;
        }));

        assert(snapshots.some((docs) => {
          const [doc1, doc2, doc3] = getSnapshot(docs);
          return doc1 === null && doc2 === null && doc3?.value === n1;
        }));

        assert(snapshots.some((docs) => {
          const [doc1, doc2, doc3] = getSnapshot(docs);
          return doc1 === null && doc2?.value === n2 && doc3?.value === n1;
        }));

        assert(snapshots.some((docs) => {
          const [doc1, doc2, doc3] = getSnapshot(docs);
          return doc1 === null && doc2?.value === n2 && doc3?.value === n3;
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
        const n1 = 10;
        const n2 = 20;
        const n3 = 30;
        let count = 0;
        let lastDocs: any[] = [];

        const { promise, cancel } = db.multi_part_id_nums.watchMany(
          [id1, id2, id3],
          (docs) => {
            count++;
            lastDocs = docs;
          },
        );

        await db.multi_part_id_nums.set(id4, n1);
        await sleep(500);
        await db.multi_part_id_nums.set(id4, n2, { overwrite: true });
        await sleep(500);
        await db.multi_part_id_nums.update(id4, n3);
        await sleep(500);
        await db.multi_part_id_nums.delete(id4);
        await sleep(500);

        assertEquals(count, 1);
        assertEquals(lastDocs[0], null);
        assertEquals(lastDocs[1], null);
        assertEquals(lastDocs[2], null);

        await cancel();
        await promise;
      });
    },
  );
});
