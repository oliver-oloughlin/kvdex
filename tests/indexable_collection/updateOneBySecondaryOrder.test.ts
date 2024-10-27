import { assert } from "../test.deps.ts";
import {
  mockUser1,
  mockUser2,
  mockUser3,
  mockUserInvalid,
  mockUsersWithAlteredAge,
} from "../mocks.ts";
import { useDb } from "../utils.ts";
import type { User } from "../models.ts";

Deno.test("indexable_collection - updateOneBySecondaryOrder", async (t) => {
  await t.step(
    "Should update only one document of KvObject type using shallow merge",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const updateCr = await db.i_users.updateOneBySecondaryOrder(
          "age",
          updateData,
          {
            strategy: "merge-shallow",
          },
        );

        assert(updateCr.ok);

        const { result } = await db.i_users.mapBySecondaryOrder(
          "age",
          (doc) => doc.value,
        );

        assert(result[0].address.country === updateData.address.country);
        assert(result[0].address.city === updateData.address.city);
        assert(result[0].address.houseNr === updateData.address.houseNr);
        assert(result[0].address.street === undefined);

        assert(result[1].address.country === mockUser1.address.country);
        assert(result[1].address.city === mockUser1.address.city);
        assert(result[1].address.houseNr === mockUser1.address.houseNr);
        assert(result[1].address.street === mockUser1.address.street);

        assert(result[2].address.country === mockUser2.address.country);
        assert(result[2].address.city === mockUser2.address.city);
        assert(result[2].address.houseNr === mockUser2.address.houseNr);
        assert(result[2].address.street === mockUser2.address.street);
      });
    },
  );

  await t.step(
    "Should update only one document of KvObject type using deep merge",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const updateCr = await db.i_users.updateOneBySecondaryOrder(
          "age",
          updateData,
          {
            offset: 1,
            strategy: "merge",
          },
        );

        assert(updateCr.ok);

        const { result } = await db.i_users.mapBySecondaryOrder(
          "age",
          (doc) => doc.value,
        );

        assert(result[1].address.country === updateData.address.country);
        assert(result[1].address.city === updateData.address.city);
        assert(result[1].address.houseNr === updateData.address.houseNr);
        assert(result[1].address.street === mockUser1.address.street);

        assert(result[0].address.country === mockUser3.address.country);
        assert(result[0].address.city === mockUser3.address.city);
        assert(result[0].address.houseNr === mockUser3.address.houseNr);
        assert(result[0].address.street === mockUser3.address.street);

        assert(result[2].address.country === mockUser2.address.country);
        assert(result[2].address.city === mockUser2.address.city);
        assert(result[2].address.houseNr === mockUser2.address.houseNr);
        assert(result[2].address.street === mockUser2.address.street);
      });
    },
  );

  await t.step(
    "Should update only one document of KvObject type using replace",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const updateData: User = {
          username: "test",
          age: 10,
          address: {
            country: "Switzerland",
            city: "Bern",
            houseNr: null,
          },
        };

        const updateCr = await db.i_users.updateOneBySecondaryOrder(
          "age",
          updateData,
          {
            strategy: "replace",
          },
        );

        assert(updateCr.ok);

        const { result } = await db.i_users.mapBySecondaryOrder(
          "age",
          (doc) => doc.value,
        );

        assert(result[0].username === updateData.username);
        assert(result[0].age === updateData.age);
        assert(result[0].address.country === updateData.address.country);
        assert(result[0].address.city === updateData.address.city);
        assert(result[0].address.houseNr === updateData.address.houseNr);
        assert(result[0].address.street === undefined);

        assert(result[1].username === mockUser1.username);
        assert(result[1].address.country === mockUser1.address.country);
        assert(result[1].address.city === mockUser1.address.city);
        assert(result[1].address.houseNr === mockUser1.address.houseNr);
        assert(result[1].address.street === mockUser1.address.street);

        assert(result[2].username === mockUser2.username);
        assert(result[2].address.country === mockUser2.address.country);
        assert(result[2].address.city === mockUser2.address.city);
        assert(result[2].address.houseNr === mockUser2.address.houseNr);
        assert(result[2].address.street === mockUser2.address.street);
      });
    },
  );

  await t.step("Should successfully parse and update", async () => {
    await useDb(async (db) => {
      let assertion = true;

      const cr = await db.zi_users.addMany(mockUsersWithAlteredAge);
      assert(cr.ok);

      const updateData: User = {
        username: "test",
        age: 10,
        address: {
          country: "Switzerland",
          city: "Bern",
          houseNr: null,
        },
      };

      await db.zi_users.updateOneBySecondaryOrder(
        "age",
        updateData,
      ).catch(() => assertion = false);

      assert(assertion);
    });
  });

  await t.step("Should fail to parse and update document", async () => {
    await useDb(async (db) => {
      let assertion = false;

      const cr = await db.zi_users.addMany(mockUsersWithAlteredAge);
      assert(cr.ok);

      await db.zi_users.updateOneBySecondaryOrder(
        "age",
        mockUserInvalid,
      ).catch(() => assertion = true);

      assert(assertion);
    });
  });
});
