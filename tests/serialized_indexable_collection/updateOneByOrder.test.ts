import { assert, assertEquals, assertNotEquals } from "@std/assert";
import {
  mockUser1,
  mockUser2,
  mockUser3,
  mockUserInvalid,
  mockUsersWithAlteredAge,
} from "../mocks.ts";
import { useDb } from "../utils.ts";
import type { User } from "../models.ts";

Deno.test("serialized_indexable_collection - updateOneByOrder", async (t) => {
  await t.step(
    "Should update only one document of KvObject type using shallow merge",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const updateCr = await db.is_users.updateOneByOrder(
          "age",
          updateData,
          {
            strategy: "merge-shallow",
          },
        );

        assert(updateCr.ok);

        const { result } = await db.is_users.mapByOrder(
          "age",
          (doc) => doc.value,
        );

        assertEquals(result[0].address.country, updateData.address.country);
        assertEquals(result[0].address.city, updateData.address.city);
        assertEquals(result[0].address.houseNr, updateData.address.houseNr);
        assertEquals(result[0].address.street, undefined);

        assertEquals(result[1].address.country, mockUser1.address.country);
        assertEquals(result[1].address.city, mockUser1.address.city);
        assertEquals(result[1].address.houseNr, mockUser1.address.houseNr);
        assertEquals(result[1].address.street, mockUser1.address.street);

        assertEquals(result[2].address.country, mockUser2.address.country);
        assertEquals(result[2].address.city, mockUser2.address.city);
        assertEquals(result[2].address.houseNr, mockUser2.address.houseNr);
        assertEquals(result[2].address.street, mockUser2.address.street);
      });
    },
  );

  await t.step(
    "Should update one document bounded by start and end values",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        // startValue 50 targets the first document with age >= 50 (user1)
        const updateCr = await db.is_users.updateOneByOrder(
          "age",
          updateData,
          { startValue: 50, strategy: "merge-shallow" },
        );
        assert(updateCr.ok);

        const { result } = await db.is_users.mapByOrder(
          "age",
          (doc) => doc.value,
        );

        // user3 (age 20) unchanged
        assertEquals(result[0].address.city, mockUser3.address.city);
        // user1 (age 50) updated
        assertEquals(result[1].address.city, updateData.address.city);
        // user2 (age 80) unchanged
        assertEquals(result[2].address.city, mockUser2.address.city);
      });
    },
  );

  await t.step(
    "Should update only one document of KvObject type using deep merge",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const updateCr = await db.is_users.updateOneByOrder(
          "age",
          updateData,
          {
            offset: 1,
            strategy: "merge",
          },
        );

        assert(updateCr.ok);

        const { result } = await db.is_users.mapByOrder(
          "age",
          (doc) => doc.value,
        );

        assertEquals(result[1].address.country, updateData.address.country);
        assertEquals(result[1].address.city, updateData.address.city);
        assertEquals(result[1].address.houseNr, updateData.address.houseNr);
        assertEquals(result[1].address.street, mockUser1.address.street);

        assertEquals(result[0].address.country, mockUser3.address.country);
        assertEquals(result[0].address.city, mockUser3.address.city);
        assertEquals(result[0].address.houseNr, mockUser3.address.houseNr);
        assertEquals(result[0].address.street, mockUser3.address.street);

        assertEquals(result[2].address.country, mockUser2.address.country);
        assertEquals(result[2].address.city, mockUser2.address.city);
        assertEquals(result[2].address.houseNr, mockUser2.address.houseNr);
        assertEquals(result[2].address.street, mockUser2.address.street);
      });
    },
  );

  await t.step(
    "Should update only one document of KvObject type using replace",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
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

        const updateCr = await db.is_users.updateOneByOrder(
          "age",
          updateData,
          {
            strategy: "replace",
          },
        );

        assert(updateCr.ok);

        const { result } = await db.is_users.mapByOrder(
          "age",
          (doc) => doc.value,
        );

        assertEquals(result[0].username, updateData.username);
        assertEquals(result[0].age, updateData.age);
        assertEquals(result[0].address.country, updateData.address.country);
        assertEquals(result[0].address.city, updateData.address.city);
        assertEquals(result[0].address.houseNr, updateData.address.houseNr);
        assertEquals(result[0].address.street, undefined);

        assertEquals(result[1].username, mockUser1.username);
        assertEquals(result[1].address.country, mockUser1.address.country);
        assertEquals(result[1].address.city, mockUser1.address.city);
        assertEquals(result[1].address.houseNr, mockUser1.address.houseNr);
        assertEquals(result[1].address.street, mockUser1.address.street);

        assertEquals(result[2].username, mockUser2.username);
        assertEquals(result[2].address.country, mockUser2.address.country);
        assertEquals(result[2].address.city, mockUser2.address.city);
        assertEquals(result[2].address.houseNr, mockUser2.address.houseNr);
        assertEquals(result[2].address.street, mockUser2.address.street);
      });
    },
  );

  await t.step("Should successfully parse and update", async () => {
    await useDb(async (db) => {
      let assertion = true;

      const cr = await db.zis_users.addMany(mockUsersWithAlteredAge);
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

      await db.zis_users.updateOneByOrder(
        "age",
        updateData,
      ).catch(() => assertion = false);

      assert(assertion);
    });
  });

  await t.step("Should fail to parse and update document", async () => {
    await useDb(async (db) => {
      let assertion = false;

      const cr = await db.zis_users.addMany(mockUsersWithAlteredAge);
      assert(cr.ok);

      await db.zis_users.updateOneByOrder(
        "age",
        mockUserInvalid,
      ).catch(() => assertion = true);

      assert(assertion);
    });
  });

  await t.step(
    "Should updateOne by index order with multi-part id",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_multi_part_id_users.addMany(
          mockUsersWithAlteredAge,
        );
        assert(cr.ok);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const updateCr = await db.is_multi_part_id_users
          .updateOneByOrder(
            "age",
            updateData,
            { strategy: "merge-shallow" },
          );

        assert(updateCr.ok);
      });
    },
  );

  await t.step(
    "Should update the first document by primary index order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const order = await db.is_users.getManyByOrder("username");
        const usernames = order.result.map((doc) => doc.value.username);

        const updateCr = await db.is_users.updateOneByOrder(
          "username",
          { address: { country: "Testland", city: "Dublin", houseNr: null } },
          { strategy: "merge-shallow" },
        );
        assert(updateCr.ok);

        const first = await db.is_users.findBy("username", usernames[0]);
        assertEquals(first?.value.address.country, "Testland");

        const second = await db.is_users.findBy("username", usernames[1]);
        assertNotEquals(second?.value.address.country, "Testland");
      });
    },
  );

  await t.step(
    "Should update one document by primary index order bounded by start value",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge);
        assert(cr.ok);

        const order = await db.is_users.getManyByOrder("username");
        const usernames = order.result.map((doc) => doc.value.username);

        const startCr = await db.is_users.updateOneByOrder(
          "username",
          { address: { country: "Sweden", city: "Stockholm", houseNr: null } },
          { strategy: "merge-shallow", startValue: usernames[1] },
        );
        assert(startCr.ok);

        const bounded = await db.is_users.findBy("username", usernames[1]);
        assertEquals(bounded?.value.address.country, "Sweden");
      });
    },
  );
});
