import { assert, assertEquals } from "@std/assert";
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts";
import { sleep, useDb } from "../utils.ts";
import type { Document } from "../../mod.ts";
import type { User } from "../models.ts";

Deno.test("serialized_collection - watch", async (t) => {
  await t.step("Should receive all document updates", async () => {
    await useDb(async (db) => {
      const id = "id";
      const docs: (Document<User, string> | null)[] = [];

      const { promise, cancel } = db.s_users.watch(id, (doc) => {
        docs.push(doc);
      });

      await db.s_users.set(id, mockUser1);
      await sleep(500);
      await db.s_users.set(id, mockUser2, { overwrite: true });
      await sleep(500);
      await db.s_users.update(id, mockUser3);
      await sleep(500);
      await db.s_users.delete(id);
      await sleep(500);

      assert(docs.some((doc) => doc?.value.username === mockUser1.username));
      assert(docs.some((doc) => doc?.value.username === mockUser2.username));
      assert(docs.some((doc) => doc?.value.username === mockUser3.username));
      assert(docs.some((doc) => doc === null));

      await cancel();
      await promise;
    });
  });

  await t.step("Should not receive unrelated document updates", async () => {
    await useDb(async (db) => {
      const id1 = "id1";
      const id2 = "id2";
      let count = 0;
      let username = "";
      let lastDoc: any;

      const { promise, cancel } = db.s_users.watch(id1, (doc) => {
        count++;
        lastDoc = doc;
        if (doc?.value.username) {
          username = doc.value.username;
        }
      });

      await db.s_users.set(id2, mockUser1);
      await sleep(500);
      await db.s_users.set(id2, mockUser2, { overwrite: true });
      await sleep(500);
      await db.s_users.update(id2, mockUser3);
      await sleep(500);
      await db.s_users.delete(id2);
      await sleep(500);

      // Account for initial invocation
      assert(count === 1);
      assert(username === "");
      assert(lastDoc === null);

      await cancel();
      await promise;
    });
  });

  await t.step(
    "Should receive all document updates for multi-part id",
    async () => {
      await useDb(async (db) => {
        const id: [string, number] = ["id", 1];
        const n1 = 10;
        const n2 = 20;
        const n3 = 30;
        const docs: (Document<number, [string, number]> | null)[] = [];

        const { promise, cancel } = db.s_multi_part_id_nums.watch(id, (doc) => {
          docs.push(doc as Document<number, [string, number]> | null);
        });

        await db.s_multi_part_id_nums.set(id, n1);
        await sleep(500);
        await db.s_multi_part_id_nums.set(id, n2, { overwrite: true });
        await sleep(500);
        await db.s_multi_part_id_nums.update(id, n3);
        await sleep(500);
        await db.s_multi_part_id_nums.delete(id);
        await sleep(500);

        assert(docs.some((doc) => doc?.value === n1));
        assert(docs.some((doc) => doc?.value === n2));
        assert(docs.some((doc) => doc?.value === n3));
        assert(docs.some((doc) => doc === null));

        await cancel();
        await promise;
      });
    },
  );

  await t.step(
    "Should not receive unrelated document updates for multi-part id",
    async () => {
      await useDb(async (db) => {
        const id1: [string, number] = ["id1", 1];
        const id2: [string, number] = ["id2", 2];
        const n1 = 10;
        const n2 = 20;
        const n3 = 30;
        let count = 0;
        let n = -1;
        let lastDoc: any;

        const { promise, cancel } = db.s_multi_part_id_nums.watch(
          id1,
          (doc) => {
            count++;
            lastDoc = doc;
            if (doc?.value) {
              n = doc.value;
            }
          },
        );

        await db.s_multi_part_id_nums.set(id2, n1);
        await sleep(500);
        await db.s_multi_part_id_nums.set(id2, n2, { overwrite: true });
        await sleep(500);
        await db.s_multi_part_id_nums.update(id2, n3);
        await sleep(500);
        await db.s_multi_part_id_nums.delete(id2);
        await sleep(500);

        // Account for initial invocation
        assertEquals(count, 1);
        assertEquals(n, -1);
        assert(lastDoc === null);

        await cancel();
        await promise;
      });
    },
  );
});
