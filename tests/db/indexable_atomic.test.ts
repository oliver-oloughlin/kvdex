import { assert, assertEquals } from "@std/assert";
import { mockUser1, mockUser3 } from "../mocks.ts";
import { useDb } from "../utils.ts";
import type { KvKey } from "../../src/core/types.ts";

Deno.test("db - indexable_atomic", async (t) => {
  await t.step(
    "Should add document to collection with index entries",
    async () => {
      await useDb(async (db) => {
        await db
          .atomic((schema) => schema.i_users)
          .add(mockUser1)
          .commit();

        const count = await db.i_users.count();

        const byPrimary = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        );

        const bySecondary = await db.i_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        );

        assert(count === 1);
        assert(byPrimary?.value.username === mockUser1.username);
        assert(bySecondary.result.at(0)?.value.username === mockUser1.username);
      });
    },
  );

  await t.step(
    "Should set document in collection with index entries",
    async () => {
      await useDb(async (db) => {
        const id = "id";

        await db
          .atomic((schema) => schema.i_users)
          .set(id, mockUser1)
          .commit();

        const byId = await db.i_users.find(id);

        const byPrimary = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        );

        const bySecondary = await db.i_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        );

        assert(byId?.id === id);
        assert(byPrimary?.id === id);
        assert(bySecondary.result.at(0)?.id === id);
      });
    },
  );

  await t.step(
    "Should not set document in collection with colliding primary index",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.i_users.add(mockUser1);
        assert(cr1.ok);

        const cr2 = await db
          .atomic((schema) => schema.i_users)
          .add(mockUser1)
          .commit();

        assert(!cr2.ok);
      });
    },
  );

  await t.step(
    "Should delete document and indices from collection",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.i_users.add(mockUser1);
        assert(cr1.ok);

        const atomicCr = await db
          .atomic((schema) => schema.i_users)
          .delete(cr1.id)
          .commit();

        const byId = await db.i_users.find(cr1.id);

        const byPrimary = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        );

        const bySecondary = await db.i_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        );

        assert(atomicCr.ok);
        assertEquals(byId, null);
        assertEquals(byPrimary, null);
        assertEquals(bySecondary.result.length, 0);
      });
    },
  );

  await t.step(
    "Should fail operation when trying to set and delete from the same indexable collection",
    async () => {
      await useDb(async (db) => {
        const cr = await db
          .atomic((schema) => schema.i_users)
          .add(mockUser1)
          .delete("id")
          .commit();

        assert(!cr.ok);
      });
    },
  );

  await t.step(
    "Should add document to collection with index entries and multi-part id",
    async () => {
      await useDb(async (db) => {
        await db
          .atomic((schema) => schema.i_multi_part_id_users)
          .add(mockUser1)
          .commit();

        const count = await db.i_multi_part_id_users.count();

        const byPrimary = await db.i_multi_part_id_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        );

        const bySecondary = await db.i_multi_part_id_users
          .findBySecondaryIndex(
            "age",
            mockUser1.age,
          );

        assert(count === 1);
        assert(byPrimary?.value.username === mockUser1.username);
        assert(bySecondary.result.at(0)?.value.username === mockUser1.username);
      });
    },
  );

  await t.step(
    "Should set document in collection with index entries and multi-part id",
    async () => {
      await useDb(async (db) => {
        const id: KvKey = ["id", 1];

        await db
          .atomic((schema) => schema.i_multi_part_id_users)
          .set(id, mockUser1)
          .commit();

        const byId = await db.i_multi_part_id_users.find(id);

        const byPrimary = await db.i_multi_part_id_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        );

        const bySecondary = await db.i_multi_part_id_users
          .findBySecondaryIndex(
            "age",
            mockUser1.age,
          );

        assert(byId !== null);
        assertEquals(byId.id, id);
        assert(byPrimary !== null);
        assertEquals(byPrimary.id, id);
        assert(bySecondary.result.length > 0);
        assertEquals(bySecondary.result.at(0)!.id, id);
      });
    },
  );

  await t.step(
    "Should not set document in collection with colliding primary index and multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.i_multi_part_id_users.add(mockUser1);
        assert(cr1.ok);

        const cr2 = await db
          .atomic((schema) => schema.i_multi_part_id_users)
          .add(mockUser1)
          .commit();

        assert(!cr2.ok);
      });
    },
  );

  await t.step(
    "Should delete document and indices from collection with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.i_multi_part_id_users.add(mockUser1);
        assert(cr1.ok);

        const atomicCr = await db
          .atomic((schema) => schema.i_multi_part_id_users)
          .delete(cr1.id)
          .commit();

        const byId = await db.i_multi_part_id_users.find(cr1.id);

        const byPrimary = await db.i_multi_part_id_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        );

        const bySecondary = await db.i_multi_part_id_users
          .findBySecondaryIndex(
            "age",
            mockUser1.age,
          );

        assert(atomicCr.ok);
        assert(byId === null);
        assert(byPrimary === null);
        assert(bySecondary.result.length === 0);
      });
    },
  );

  await t.step(
    "Should fail operation when trying to set and delete from the same indexable collection with multi-part id",
    async () => {
      await useDb(async (db) => {
        const id: KvKey = ["id", 1];

        const cr = await db
          .atomic((schema) => schema.i_multi_part_id_users)
          .add(mockUser1)
          .delete(id)
          .commit();

        assert(!cr.ok);
      });
    },
  );

  await t.step(
    "Should only apply latest set on same document and update indices",
    async () => {
      await useDb(async (db) => {
        const id = "id";

        const cr = await db
          .atomic((schema) => schema.i_users)
          .set(id, mockUser1)
          .set(id, mockUser3)
          .commit();

        assert(cr.ok);

        const count = await db.i_users.count();
        assertEquals(count, 1);

        // Document should have the latest value
        const doc = await db.i_users.find(id);
        assertEquals(doc?.value, mockUser3);

        // Old primary index should not return a document
        const byOldPrimary = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        );
        assertEquals(byOldPrimary, null);

        // New primary index should return the document
        const byNewPrimary = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser3.username,
        );
        assertEquals(byNewPrimary?.value, mockUser3);

        // Old secondary index should not find the document
        const { result: [byOldSecondary] } = await db.i_users
          .findBySecondaryIndex("age", mockUser1.age);
        assertEquals(byOldSecondary, undefined);

        // New secondary index should find the document
        const { result: [byNewSecondary] } = await db.i_users
          .findBySecondaryIndex("age", mockUser3.age);
        assertEquals(byNewSecondary?.value, mockUser3);
      });
    },
  );

  await t.step(
    "Should apply delete as latest mutation and remove indices when set is called before delete",
    async () => {
      await useDb(async (db) => {
        const id = "id";

        const cr = await db
          .atomic((schema) => schema.i_users)
          .set(id, mockUser1)
          .delete(id)
          .commit();

        assert(cr.ok);

        const doc = await db.i_users.find(id);
        assertEquals(doc, null);

        const count = await db.i_users.count();
        assertEquals(count, 0);

        // Primary index should not return a document
        const byPrimary = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        );
        assertEquals(byPrimary, null);

        // Secondary index should not return a document
        const { result: bySecondary } = await db.i_users
          .findBySecondaryIndex("age", mockUser1.age);
        assertEquals(bySecondary.length, 0);
      });
    },
  );

  await t.step(
    "Should apply set as latest mutation with indices when delete is called before set",
    async () => {
      await useDb(async (db) => {
        const id = "id";

        const cr = await db
          .atomic((schema) => schema.i_users)
          .delete(id)
          .set(id, mockUser3)
          .commit();

        assert(cr.ok);

        const doc = await db.i_users.find(id);
        assertEquals(doc?.value, mockUser3);

        // Primary index should return the document
        const byPrimary = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser3.username,
        );
        assertEquals(byPrimary?.value, mockUser3);

        // Secondary index should return the document
        const { result: [bySecondary] } = await db.i_users
          .findBySecondaryIndex("age", mockUser3.age);
        assertEquals(bySecondary?.value, mockUser3);
      });
    },
  );
});
