import type { Document } from "../../mod.ts";
import { assert, assertEquals } from "@std/assert";
import { equals } from "@std/bytes/equals";
import { mockUser1, mockUser2, mockUser3, mockUserInvalid } from "../mocks.ts";
import type { User } from "../models.ts";
import { generateLargeUsers, useDb } from "../utils.ts";
import { extendKey } from "../../src/core/utils.ts";
import type { DenoKvEntry } from "../../src/core/types.ts";

Deno.test("serialized_indexable_collection - update", async (t) => {
  await t.step(
    "Should update document of KvObject type using shallow merge",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.add(mockUser1);
        assert(cr.ok);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const updateCr = await db.is_users.update(cr.id, updateData, {
          strategy: "merge-shallow",
        });

        const byId = await db.is_users.find(cr.id);

        const byPrimary = await db.is_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        );

        const bySecondary = await db.is_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        );

        assert(updateCr.ok);
        assert(updateCr.id === cr.id);
        assert(byPrimary?.id === cr.id);
        assert(bySecondary.result.at(0)?.id === cr.id);
        assert(updateCr.versionstamp !== cr.versionstamp);
        assert(updateCr.versionstamp === byPrimary.versionstamp);
        assert(
          updateCr.versionstamp === bySecondary.result.at(0)?.versionstamp,
        );

        const asserts = (doc: Document<User, string> | null) => {
          assert(doc !== null);
          assert(doc.value.username === mockUser1.username);
          assert(doc.value.age === mockUser1.age);
          assert(doc.value.address.country === updateData.address.country);
          assert(doc.value.address.city === updateData.address.city);
          assert(doc.value.address.houseNr === updateData.address.houseNr);
          assert(typeof doc.value.address.street === "undefined");
        };

        asserts(byId);
        asserts(byPrimary);
        asserts(bySecondary.result.at(0) ?? null);
      });
    },
  );

  await t.step(
    "Should update document of KvObject type using deep merge",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.add(mockUser1);
        assert(cr.ok);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const updateCr = await db.is_users.update(cr.id, updateData, {
          strategy: "merge",
        });

        const byId = await db.is_users.find(cr.id);

        const byPrimary = await db.is_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        );

        const bySecondary = await db.is_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        );

        assert(updateCr.ok);
        assert(updateCr.id === cr.id);
        assert(byPrimary?.id === cr.id);
        assert(bySecondary.result.at(0)?.id === cr.id);
        assert(updateCr.versionstamp !== cr.versionstamp);
        assert(updateCr.versionstamp === byPrimary.versionstamp);
        assert(
          updateCr.versionstamp === bySecondary.result.at(0)?.versionstamp,
        );

        const asserts = (doc: Document<User, string> | null) => {
          assert(doc !== null);
          assert(doc.value.username === mockUser1.username);
          assert(doc.value.age === mockUser1.age);
          assert(doc.value.address.country === updateData.address.country);
          assert(doc.value.address.city === updateData.address.city);
          assert(doc.value.address.houseNr === updateData.address.houseNr);
          assert(doc.value.address.street !== undefined);
        };

        asserts(byId);
        asserts(byPrimary);
        asserts(bySecondary.result.at(0) ?? null);
      });
    },
  );

  await t.step(
    "Should update document of KvObject type using replace",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.add(mockUser1);
        assert(cr.ok);

        const updateCr = await db.is_users.update(cr.id, mockUser2, {
          strategy: "replace",
        });

        const byId = await db.is_users.find(cr.id);

        const byPrimary = await db.is_users.findByPrimaryIndex(
          "username",
          mockUser2.username,
        );

        const bySecondary = await db.is_users.findBySecondaryIndex(
          "age",
          mockUser2.age,
        );

        assert(updateCr.ok);
        assert(updateCr.id === cr.id);
        assert(byPrimary?.id === cr.id);
        assert(bySecondary.result.at(0)?.id === cr.id);
        assert(updateCr.versionstamp !== cr.versionstamp);
        assert(updateCr.versionstamp === byPrimary.versionstamp);
        assert(
          updateCr.versionstamp === bySecondary.result.at(0)?.versionstamp,
        );

        const asserts = (doc: Document<User, string> | null) => {
          assert(doc !== null);
          assert(doc.value.username === mockUser2.username);
          assert(doc.value.age === mockUser2.age);
          assert(doc.value.address.country === mockUser2.address.country);
          assert(doc.value.address.city === mockUser2.address.city);
          assert(doc.value.address.houseNr === mockUser2.address.houseNr);
          assert(doc.value.address.street === mockUser2.address.street);
        };

        asserts(byId);
        asserts(byPrimary);
        asserts(bySecondary.result.at(0) ?? null);
      });
    },
  );

  await t.step(
    "Should not update document or delete indexed entries upon index collision",
    async () => {
      await useDb(async (db) => {
        const id1 = "id1";
        const id2 = "id2";

        const cr1 = await db.is_users.set(id1, mockUser1);
        const cr2 = await db.is_users.set(id2, mockUser2);

        assert(cr1.ok);
        assert(cr2.ok);

        const update = await db.is_users.update(id2, {
          ...mockUser3,
          username: mockUser1.username,
        });

        assert(!update.ok);

        const doc = await db.is_users.find(id2);
        const docByPrimaryIndex = await db.is_users.findByPrimaryIndex(
          "username",
          mockUser2.username,
        );

        assert(doc?.value.username === mockUser2.username);
        assert(docByPrimaryIndex?.value.username === mockUser2.username);
      });
    },
  );

  await t.step("Should successfully parse and update document", async () => {
    await useDb(async (db) => {
      let assertion = true;

      const cr = await db.zis_users.add(mockUser1);
      assert(cr.ok);

      await db.zis_users.update(cr.id, mockUser2).catch(() =>
        assertion = false
      );

      assert(assertion);
    });
  });

  await t.step("Should fail to parse and update document", async () => {
    await useDb(async (db) => {
      let assertion = false;

      const cr = await db.zis_users.add(mockUser1);
      assert(cr.ok);

      await db.zis_users.update(cr.id, mockUserInvalid).catch(() =>
        assertion = true
      );

      assert(assertion);
    });
  });

  await t.step(
    "Should update document with multi-part id using replace",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_multi_part_id_users.add(mockUser1);
        assert(cr.ok);

        const updateCr = await db.is_multi_part_id_users.update(
          cr.id,
          mockUser2,
          { strategy: "replace" },
        );

        assert(updateCr.ok);

        const doc = await db.is_multi_part_id_users.find(cr.id);
        assert(doc !== null);
        assert(doc.value.username === mockUser2.username);
      });
    },
  );

  await t.step(
    "Should clean up old segments when updating document",
    async () => {
      await useDb(async (db) => {
        const kv = db.is_users["kv"];
        const [largeUser] = generateLargeUsers(1);

        // Add a large document that requires segments
        const cr = await db.is_users.add(largeUser);
        assert(cr.ok);

        // Collect old segment entries
        const segmentPrefix = extendKey(db.is_users["keys"].segment, cr.id);
        const oldEntries: DenoKvEntry[] = [];
        const iterBefore = await kv.list({ prefix: segmentPrefix });
        for await (const entry of iterBefore) {
          oldEntries.push(entry as DenoKvEntry);
        }
        assert(oldEntries.length > 0);

        // Update with a different value
        const updateCr = await db.is_users.update(cr.id, mockUser1, {
          strategy: "replace",
        });
        assert(updateCr.ok);

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
              "Old segment content should not be present after update",
            );
          }
        }

        // Verify the document reads correctly
        const doc = await db.is_users.find(cr.id);
        assertEquals(doc?.value, mockUser1);
      });
    },
  );

  await t.step(
    "Should clean up old segments when updating document using batched mode",
    async () => {
      await useDb(async (db) => {
        const kv = db.is_users["kv"];
        const [largeUser] = generateLargeUsers(1);

        // Add a large document that requires segments
        const cr = await db.is_users.add(largeUser);
        assert(cr.ok);

        // Collect old segment entries
        const segmentPrefix = extendKey(db.is_users["keys"].segment, cr.id);
        const oldEntries: DenoKvEntry[] = [];
        const iterBefore = await kv.list({ prefix: segmentPrefix });
        for await (const entry of iterBefore) {
          oldEntries.push(entry as DenoKvEntry);
        }
        assert(oldEntries.length > 0);

        // Update with a different value using batched mode
        const updateCr = await db.is_users.update(cr.id, mockUser1, {
          strategy: "replace",
          batched: true,
        });
        assert(updateCr.ok);

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
              "Old segment content should not be present after update",
            );
          }
        }

        // Verify the document reads correctly
        const doc = await db.is_users.find(cr.id);
        assertEquals(doc?.value, mockUser1);
      });
    },
  );
});
