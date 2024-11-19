import { assert } from "@std/assert";
import { mockUser1, mockUser2, mockUser3, mockUserInvalid } from "../mocks.ts";
import { sleep, useDb } from "../utils.ts";

Deno.test("serialized_indexable_collection - updateOne", async (t) => {
  await t.step(
    "Should update only one document of KvObject type using shallow merge",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.is_users.add(mockUser1);
        await sleep(10);
        const cr2 = await db.is_users.add(mockUser2);

        assert(cr1.ok);
        assert(cr2.ok);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const updateCr = await db.is_users.updateOne(updateData, {
          strategy: "merge-shallow",
        });

        assert(updateCr.ok);

        const doc1 = await db.is_users.find(cr1.id);
        const doc2 = await db.is_users.find(cr2.id);

        assert(doc1);
        assert(doc2);

        assert(doc1.value.address.country === updateData.address.country);
        assert(doc1.value.address.city === updateData.address.city);
        assert(doc1.value.address.houseNr === updateData.address.houseNr);
        assert(doc1.value.address.street === undefined);

        assert(doc2.value.address.country === mockUser2.address.country);
        assert(doc2.value.address.city === mockUser2.address.city);
        assert(doc2.value.address.houseNr === mockUser2.address.houseNr);
        assert(doc2.value.address.street === mockUser2.address.street);
      });
    },
  );

  await t.step(
    "Should update only one document of KvObject type using deep merge",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.is_users.add(mockUser1);
        await sleep(10);
        const cr2 = await db.is_users.add(mockUser2);

        assert(cr1.ok);
        assert(cr2.ok);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const updateCr = await db.is_users.updateOne(updateData, {
          strategy: "merge",
        });

        assert(updateCr.ok);

        const doc1 = await db.is_users.find(cr1.id);
        const doc2 = await db.is_users.find(cr2.id);

        assert(doc1);
        assert(doc2);

        assert(doc1.value.address.country === updateData.address.country);
        assert(doc1.value.address.city === updateData.address.city);
        assert(doc1.value.address.houseNr === updateData.address.houseNr);
        assert(doc1.value.address.street === mockUser1.address.street);

        assert(doc2.value.address.country === mockUser2.address.country);
        assert(doc2.value.address.city === mockUser2.address.city);
        assert(doc2.value.address.houseNr === mockUser2.address.houseNr);
        assert(doc2.value.address.street === mockUser2.address.street);
      });
    },
  );

  await t.step(
    "Should update only one document of KvObject type using replace",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.is_users.add(mockUser1);
        await sleep(10);
        const cr2 = await db.is_users.add(mockUser2);

        assert(cr1.ok);
        assert(cr2.ok);

        const updateData = mockUser3;

        const updateCr = await db.is_users.updateOne(updateData, {
          strategy: "replace",
        });

        assert(updateCr.ok);

        const doc1 = await db.is_users.find(cr1.id);
        const doc2 = await db.is_users.find(cr2.id);

        assert(doc1);
        assert(doc2);

        assert(doc1.value.username === updateData.username);
        assert(doc1.value.age === updateData.age);
        assert(doc1.value.address.country === updateData.address.country);
        assert(doc1.value.address.city === updateData.address.city);
        assert(doc1.value.address.houseNr === updateData.address.houseNr);
        assert(doc1.value.address.street === undefined);

        assert(doc2.value.username === mockUser2.username);
        assert(doc2.value.age === mockUser2.age);
        assert(doc2.value.address.country === mockUser2.address.country);
        assert(doc2.value.address.city === mockUser2.address.city);
        assert(doc2.value.address.houseNr === mockUser2.address.houseNr);
        assert(doc2.value.address.street === mockUser2.address.street);
      });
    },
  );

  await t.step("Should successfully parse and update", async () => {
    await useDb(async (db) => {
      let assertion = true;

      const cr1 = await db.zis_users.add(mockUser1);
      await sleep(10);
      const cr2 = await db.zis_users.add(mockUser2);

      assert(cr1.ok);
      assert(cr2.ok);

      await db.zis_users.updateOne(mockUser1).catch(() => assertion = false);

      assert(assertion);
    });
  });

  await t.step("Should fail to parse and update document", async () => {
    await useDb(async (db) => {
      let assertion = false;

      const cr1 = await db.zis_users.add(mockUser1);
      await sleep(10);
      const cr2 = await db.zis_users.add(mockUser2);

      assert(cr1.ok);
      assert(cr2.ok);

      await db.zis_users.updateOne(mockUserInvalid).catch(() =>
        assertion = true
      );

      assert(assertion);
    });
  });
});
