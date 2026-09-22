import { assert, assertEquals } from "@std/assert";
import { mockUser1, mockUser2, mockUserInvalid } from "../mocks.ts";
import { generateIncompressibleUser, useDb } from "../utils.ts";
import { extendKey } from "../../src/core/utils.ts";
import type { DenoKvEntry, DenoKvStrictKey } from "../../src/core/types.ts";

Deno.test("serialized_collection - set", async (t) => {
  await t.step("Should set new document entry in collection", async () => {
    await useDb(async (db) => {
      const cr = await db.s_users.set("id", mockUser1);
      assert(cr.ok);

      const doc = await db.s_users.find(cr.id);
      assert(doc !== null);
      assert(doc.value.username === mockUser1.username);
    });
  });

  await t.step(
    "Should not set new document entry in collection with colliding id",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.s_users.set("id", mockUser1);
        assert(cr1.ok);

        const cr2 = await db.s_users.set("id", mockUser2);
        assert(!cr2.ok);

        const doc = await db.s_users.find("id");
        assert(doc !== null);
        assert(doc.value.username === mockUser1.username);
      });
    },
  );

  await t.step(
    "Should overwrite document in collection with colliding id",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.s_users.set("id", mockUser1);
        assert(cr1.ok);

        const cr2 = await db.s_users.set("id", mockUser2, { overwrite: true });
        assert(cr2.ok);

        const doc = await db.s_users.find("id");
        assert(doc !== null);
        assert(doc.value.username === mockUser2.username);
      });
    },
  );

  await t.step("Should successfully parse and set document", async () => {
    await useDb(async (db) => {
      let assertion = true;
      await db.zs_users.set("id", mockUser1).catch(() => assertion = false);
      assert(assertion);
    });
  });

  await t.step("Should fail to parse and set document", async () => {
    await useDb(async (db) => {
      let assertion = false;
      await db.zs_users.set("id", mockUserInvalid).catch(() =>
        assertion = true
      );
      assert(assertion);
    });
  });

  await t.step("Should set document with multi-part id", async () => {
    await useDb(async (db) => {
      const id: [string, number] = ["id", 1];
      const n = 10;

      const cr = await db.s_multi_part_id_nums.set(id, n);
      assert(cr.ok);

      const doc = await db.s_multi_part_id_nums.find(id);
      assert(doc !== null);
      assertEquals(doc.value, n);
    });
  });

  await t.step(
    "Should clean up old segments when overwriting document",
    async () => {
      await useDb(async (db) => {
        const kv = db.s_users["kv"];
        const largeUser = generateIncompressibleUser();

        // Set a large document that requires segments
        const cr1 = await db.s_users.set("id", largeUser);
        assert(cr1.ok);

        // Collect old segment entries
        const segmentPrefix = extendKey(db.s_users["keys"].segment, "id");
        const oldEntries: DenoKvEntry[] = [];
        const iterBefore = await kv.list({ prefix: segmentPrefix });
        for await (const entry of iterBefore) {
          oldEntries.push(entry as DenoKvEntry);
        }
        assert(
          oldEntries.length > 1,
          "Old document must span multiple segments",
        );

        const cr2 = await db.s_users.set("id", mockUser1, {
          overwrite: true,
        });
        assert(cr2.ok);

        // Collect new segment entries
        const newEntries: DenoKvEntry[] = [];
        const iterAfter = await kv.list({ prefix: segmentPrefix });
        for await (const entry of iterAfter) {
          newEntries.push(entry as DenoKvEntry);
        }

        assertEquals(newEntries.map((entry) => entry.key), [
          extendKey(segmentPrefix, 0),
        ]);
        for (const oldEntry of oldEntries.slice(1)) {
          const deleted = await kv.get(oldEntry.key as DenoKvStrictKey);
          assertEquals(deleted.value, null);
          assertEquals(deleted.versionstamp, null);
        }

        // Verify the document reads correctly
        const doc = await db.s_users.find("id");
        assertEquals(doc?.value, mockUser1);
      });
    },
  );

  await t.step(
    "Should clean up old segments when overwriting document using batched mode",
    async () => {
      await useDb(async (db) => {
        const kv = db.s_users["kv"];
        const largeUser = generateIncompressibleUser();

        // Set a large document that requires segments
        const cr1 = await db.s_users.set("id", largeUser, { batched: true });
        assert(cr1.ok);

        // Collect old segment entries
        const segmentPrefix = extendKey(db.s_users["keys"].segment, "id");
        const oldEntries: DenoKvEntry[] = [];
        const iterBefore = await kv.list({ prefix: segmentPrefix });
        for await (const entry of iterBefore) {
          oldEntries.push(entry as DenoKvEntry);
        }
        assert(
          oldEntries.length > 1,
          "Old document must span multiple segments",
        );

        const cr2 = await db.s_users.set("id", mockUser1, {
          overwrite: true,
          batched: true,
        });
        assert(cr2.ok);

        // Collect new segment entries
        const newEntries: DenoKvEntry[] = [];
        const iterAfter = await kv.list({ prefix: segmentPrefix });
        for await (const entry of iterAfter) {
          newEntries.push(entry as DenoKvEntry);
        }

        assertEquals(newEntries.map((entry) => entry.key), [
          extendKey(segmentPrefix, 0),
        ]);
        for (const oldEntry of oldEntries.slice(1)) {
          const deleted = await kv.get(oldEntry.key as DenoKvStrictKey);
          assertEquals(deleted.value, null);
          assertEquals(deleted.versionstamp, null);
        }

        // Verify the document reads correctly
        const doc = await db.s_users.find("id");
        assertEquals(doc?.value, mockUser1);
      });
    },
  );
});
