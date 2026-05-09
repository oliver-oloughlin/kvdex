import { assert, assertEquals } from "@std/assert";
import { equals } from "@std/bytes/equals";
import { mockUser1, mockUserInvalid } from "../mocks.ts";
import { generateLargeUsers, useDb } from "../utils.ts";
import { extendKey } from "../../src/core/utils.ts";
import type { DenoKvEntry } from "../../src/core/types.ts";

const [user1, user2] = generateLargeUsers(2);

Deno.test("serialized_indexable_collection - set", async (t) => {
  await t.step("Should set new document entry in collection", async () => {
    await useDb(async (db) => {
      const cr = await db.is_users.set("id", user1);
      assert(cr.ok);

      const doc = await db.is_users.find(cr.id);
      assert(doc !== null);
      assert(doc.value.username === user1.username);
    });
  });

  await t.step(
    "Should not set new document entry in collection with colliding id",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.is_users.set("id", user1);
        assert(cr1.ok);

        const cr2 = await db.is_users.set("id", user2);
        assert(!cr2.ok);

        const doc = await db.is_users.find("id");
        assert(doc !== null);
        assert(doc.value.username === user1.username);
      });
    },
  );

  await t.step(
    "Should not set new document entry in collection with primary index",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.is_users.set("id1", user1);
        assert(cr1.ok);

        const cr2 = await db.is_users.set("id2", user1);
        assert(!cr2.ok);

        const byPrimary = await db.is_users.findByPrimaryIndex(
          "username",
          user1.username,
        );

        const bySecondary = await db.is_users.findBySecondaryIndex(
          "age",
          user1.age,
        );

        assert(byPrimary?.id === cr1.id);
        assert(bySecondary.result.length === 1);
      });
    },
  );

  await t.step(
    "Should overwrite document in collection with colliding id",
    async () => {
      await useDb(async (db) => {
        const u1 = user1;
        const u2 = { ...user2, age: user1.age + 1 };

        const cr1 = await db.is_users.set("id", u1);
        assert(cr1.ok);

        const cr2 = await db.is_users.set("id", u2, { overwrite: true });
        assert(cr2.ok);

        const docById = await db.is_users.find("id");

        const docByOldPrimaryIndex = await db.is_users.findByPrimaryIndex(
          "username",
          u1.username,
        );

        const docByNewPrimaryIndex = await db.is_users.findByPrimaryIndex(
          "username",
          u2.username,
        );

        const { result: [docByOldSecondaryIndex] } = await db.is_users
          .findBySecondaryIndex("age", u1.age);

        const { result: [docByNewSecondaryIndex] } = await db.is_users
          .findBySecondaryIndex("age", u2.age);

        assertEquals(docById?.value, u2);
        assertEquals(docByOldPrimaryIndex, null);
        assertEquals(docByNewPrimaryIndex?.value, u2);
        assertEquals(docByOldSecondaryIndex?.value, undefined);
        assertEquals(docByNewSecondaryIndex?.value, u2);
      });
    },
  );

  await t.step(
    "Should overwrite document in collection with colliding primary index",
    async () => {
      await useDb(async (db) => {
        const u1 = user1;
        const u2 = { ...user2, username: user1.username, age: user1.age + 1 };

        const cr1 = await db.is_users.set("id", u1);
        assert(cr1.ok);

        const cr2 = await db.is_users.set("id", u2, { overwrite: true });
        assert(cr2.ok);

        const docById = await db.is_users.find("id");

        const docByPrimaryIndex = await db.is_users.findByPrimaryIndex(
          "username",
          u1.username,
        );

        const { result: [docByOldSecondaryIndex] } = await db.is_users
          .findBySecondaryIndex("age", u1.age);

        const { result: [docByNewSecondaryIndex] } = await db.is_users
          .findBySecondaryIndex("age", u2.age);

        assertEquals(docById?.value, u2);
        assertEquals(docByPrimaryIndex?.value, u2);
        assertEquals(docByOldSecondaryIndex?.value, undefined);
        assertEquals(docByNewSecondaryIndex?.value, u2);
      });
    },
  );

  await t.step("Should successfully parse and set document", async () => {
    await useDb(async (db) => {
      let assertion = true;
      await db.zis_users.set("id", user1).catch(() => assertion = false);
      assert(assertion);
    });
  });

  await t.step("Should fail to parse and set document", async () => {
    await useDb(async (db) => {
      let assertion = false;
      await db.zis_users.set("id", mockUserInvalid).catch(() =>
        assertion = true
      );
      assert(assertion);
    });
  });

  await t.step("Should set document with multi-part id", async () => {
    await useDb(async (db) => {
      const id: [string, number] = ["id", 1];

      const cr = await db.is_multi_part_id_users.set(id, mockUser1);
      assert(cr.ok);

      const doc = await db.is_multi_part_id_users.find(id);
      assert(doc !== null);
      assert(doc.value.username === mockUser1.username);
    });
  });

  await t.step(
    "Should clean up old segments when overwriting document",
    async () => {
      await useDb(async (db) => {
        const kv = db.is_users["kv"];
        const [largeUser] = generateLargeUsers(1);

        // Set a large document that requires segments
        const cr1 = await db.is_users.set("id", largeUser);
        assert(cr1.ok);

        // Collect old segment entries
        const segmentPrefix = extendKey(db.is_users["keys"].segment, "id");
        const oldEntries: DenoKvEntry[] = [];
        const iterBefore = await kv.list({ prefix: segmentPrefix });
        for await (const entry of iterBefore) {
          oldEntries.push(entry as DenoKvEntry);
        }
        assert(oldEntries.length > 0);

        // Overwrite with a different large document
        const cr2 = await db.is_users.set("id", mockUser1, {
          overwrite: true,
        });
        assert(cr2.ok);

        // Collect new segment entries
        const newEntries: DenoKvEntry[] = [];
        const iterAfter = await kv.list({ prefix: segmentPrefix });
        for await (const entry of iterAfter) {
          newEntries.push(entry as DenoKvEntry);
        }

        // Verify none of the old segment values appear in the new entries
        for (const oldEntry of oldEntries) {
          const oldBytes = oldEntry.value as Uint8Array;
          for (const newEntry of newEntries) {
            const newBytes = newEntry.value as Uint8Array;
            assert(
              !equals(oldBytes, newBytes),
              "Old segment content should not be present after overwrite",
            );
          }
        }

        // Verify the document reads correctly
        const doc = await db.is_users.find("id");
        assertEquals(doc?.value, mockUser1);
      });
    },
  );

  await t.step(
    "Should clean up old segments when overwriting document using batched mode",
    async () => {
      await useDb(async (db) => {
        const kv = db.is_users["kv"];
        const [largeUser] = generateLargeUsers(1);

        // Set a large document that requires segments
        const cr1 = await db.is_users.set("id", largeUser, { batched: true });
        assert(cr1.ok);

        // Collect old segment entries
        const segmentPrefix = extendKey(db.is_users["keys"].segment, "id");
        const oldEntries: DenoKvEntry[] = [];
        const iterBefore = await kv.list({ prefix: segmentPrefix });
        for await (const entry of iterBefore) {
          oldEntries.push(entry as DenoKvEntry);
        }
        assert(oldEntries.length > 0);

        // Overwrite with a different large document
        const cr2 = await db.is_users.set("id", mockUser1, {
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

        // Verify none of the old segment values appear in the new entries
        for (const oldEntry of oldEntries) {
          const oldBytes = oldEntry.value as Uint8Array;
          for (const newEntry of newEntries) {
            const newBytes = newEntry.value as Uint8Array;
            assert(
              !equals(oldBytes, newBytes),
              "Old segment content should not be present after overwrite",
            );
          }
        }

        // Verify the document reads correctly
        const doc = await db.is_users.find("id");
        assertEquals(doc?.value, mockUser1);
      });
    },
  );
});
