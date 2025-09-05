import { assert, assertEquals } from "@std/assert";
import { mockUser1, mockUser2, mockUser3, mockUserInvalid } from "../mocks.ts";
import { sleep, useDb } from "../utils.ts";

Deno.test("serialized_indexable_collection - updateOneBySecondaryIndex", async (t) => {
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

        const updateCr = await db.is_users.updateOneBySecondaryIndex(
          "age",
          mockUser1.age,
          updateData,
          {
            strategy: "merge-shallow",
          },
        );

        assert(updateCr.ok);

        const doc1 = await db.is_users.find(cr1.id);
        const doc2 = await db.is_users.find(cr2.id);

        assert(doc1);
        assert(doc2);

        const [updated, _] = doc1.id === updateCr.id
          ? [doc1, mockUser1]
          : [doc2, mockUser2];

        const [notUpdated, notUpdatedMock] = doc1.id === updateCr.id
          ? [doc2, mockUser2]
          : [doc1, mockUser1];

        // Assert updated
        assertEquals(updated.value.address.country, updateData.address.country);
        assertEquals(updated.value.address.city, updateData.address.city);
        assertEquals(updated.value.address.houseNr, updateData.address.houseNr);
        assertEquals(updated.value.address.street, undefined);

        // Assert not updated
        assertEquals(
          notUpdated.value.address.country,
          notUpdatedMock.address.country,
        );
        assertEquals(
          notUpdated.value.address.city,
          notUpdatedMock.address.city,
        );
        assertEquals(
          notUpdated.value.address.houseNr,
          notUpdatedMock.address.houseNr,
        );
        assertEquals(
          notUpdated.value.address.street,
          notUpdatedMock.address.street,
        );
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

        const updateCr = await db.is_users.updateOneBySecondaryIndex(
          "age",
          mockUser2.age,
          updateData,
          {
            strategy: "merge",
          },
        );

        assert(updateCr.ok);

        const doc1 = await db.is_users.find(cr1.id);
        const doc2 = await db.is_users.find(cr2.id);

        assert(doc1);
        assert(doc2);

        const [updated, updatedMock] = doc1.id === updateCr.id
          ? [doc1, mockUser1]
          : [doc2, mockUser2];

        const [notUpdated, notUpdatedMock] = doc1.id === updateCr.id
          ? [doc2, mockUser2]
          : [doc1, mockUser1];

        // Assert updated
        assertEquals(updated.value.address.country, updateData.address.country);
        assertEquals(updated.value.address.city, updateData.address.city);
        assertEquals(updated.value.address.houseNr, updateData.address.houseNr);
        assertEquals(updated.value.address.street, updatedMock.address.street);

        // Assert not updated
        assertEquals(
          notUpdated.value.address.country,
          notUpdatedMock.address.country,
        );
        assertEquals(
          notUpdated.value.address.city,
          notUpdatedMock.address.city,
        );
        assertEquals(
          notUpdated.value.address.houseNr,
          notUpdatedMock.address.houseNr,
        );
        assertEquals(
          notUpdated.value.address.street,
          notUpdatedMock.address.street,
        );
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

        const updateCr = await db.is_users.updateOneBySecondaryIndex(
          "age",
          mockUser2.age,
          updateData,
          {
            strategy: "replace",
          },
        );

        assert(updateCr.ok);

        const doc1 = await db.is_users.find(cr1.id);
        const doc2 = await db.is_users.find(cr2.id);

        assert(doc1);
        assert(doc2);

        const [updated, _] = doc1.id === updateCr.id
          ? [doc1, mockUser1]
          : [doc2, mockUser2];

        const [notUpdated, notUpdatedMock] = doc1.id === updateCr.id
          ? [doc2, mockUser2]
          : [doc1, mockUser1];

        // Assert updated
        assertEquals(updated.value.username, updateData.username);
        assertEquals(updated.value.age, updateData.age);
        assertEquals(updated.value.address.country, updateData.address.country);
        assertEquals(updated.value.address.city, updateData.address.city);
        assertEquals(updated.value.address.houseNr, updateData.address.houseNr);
        assertEquals(updated.value.address.street, undefined);

        // Assert not updated
        assertEquals(notUpdated.value.username, notUpdatedMock.username);
        assertEquals(notUpdated.value.age, notUpdatedMock.age);
        assertEquals(
          notUpdated.value.address.country,
          notUpdatedMock.address.country,
        );
        assertEquals(
          notUpdated.value.address.city,
          notUpdatedMock.address.city,
        );
        assertEquals(
          notUpdated.value.address.houseNr,
          notUpdatedMock.address.houseNr,
        );
        assertEquals(
          notUpdated.value.address.street,
          notUpdatedMock.address.street,
        );
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

      await db.zis_users.updateOneBySecondaryIndex(
        "age",
        mockUser2.age,
        mockUser1,
      ).catch(() => assertion = false);

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

      await db.zis_users.updateOneBySecondaryIndex(
        "age",
        mockUser2.age,
        mockUserInvalid,
      ).catch(() => assertion = true);

      assert(assertion);
    });
  });
});
