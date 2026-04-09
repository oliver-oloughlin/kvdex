import { assert } from "@std/assert";
import { mockUser1, mockUser2, mockUser3, mockUserInvalid } from "../mocks.ts";
import { generateUsers, useDb } from "../utils.ts";
import { keyEq } from "../../src/core/utils.ts";
import type { KvKey } from "../../src/core/types.ts";

Deno.test("serialized_indexable_collection - updateMany", async (t) => {
  await t.step(
    "Should update 1000 documents of KvObject type using shallow merge",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000);
        const cr = await db.is_users.addMany(users);
        assert(cr.ok);

        const docs = await db.is_users.getMany();
        const ids = docs.result.map((doc) => doc.id);
        const versionstamps = docs.result.map((doc) => doc.versionstamp);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const { result } = await db.is_users.updateMany(updateData, {
          strategy: "merge-shallow",
        });

        assert(
          result.every((cr) =>
            cr.ok && ids.includes(cr.id) &&
            !versionstamps.includes(cr.versionstamp)
          ),
        );

        await db.is_users.forEach((doc) => {
          assert(doc.value.address.country === updateData.address.country);
          assert(doc.value.address.city === updateData.address.city);
          assert(doc.value.address.houseNr === updateData.address.houseNr);
          assert(typeof doc.value.address.street === "undefined");
        });
      });
    },
  );

  await t.step(
    "Should update 1000 documents of KvObject type using deep merge",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000);
        const cr = await db.is_users.addMany(users);
        assert(cr.ok);

        const docs = await db.is_users.getMany();
        const ids = docs.result.map((doc) => doc.id);
        const versionstamps = docs.result.map((doc) => doc.versionstamp);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const { result } = await db.is_users.updateMany(updateData, {
          strategy: "merge",
        });

        assert(
          result.every((cr) =>
            cr.ok && ids.includes(cr.id) &&
            !versionstamps.includes(cr.versionstamp)
          ),
        );

        await db.is_users.forEach((doc) => {
          assert(doc.value.address.country === updateData.address.country);
          assert(doc.value.address.city === updateData.address.city);
          assert(doc.value.address.houseNr === updateData.address.houseNr);
          assert(doc.value.address.street !== undefined);
        });
      });
    },
  );

  await t.step(
    "Should only update one document of type KvObject using replace (primary index collision)",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000);
        const cr = await db.is_users.addMany(users);
        assert(cr.ok);

        const docs = await db.is_users.getMany();
        const ids = docs.result.map((doc) => doc.id);
        const versionstamps = docs.result.map((doc) => doc.versionstamp);

        const { result } = await db.is_users.updateMany(mockUser1, {
          strategy: "replace",
        });

        assert(
          result.some((cr) =>
            cr.ok && ids.includes(cr.id) &&
            !versionstamps.includes(cr.versionstamp)
          ),
        );

        assert(
          result.some((cr) => !cr.ok),
        );

        const byPrimary = await db.is_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        );

        const { result: [bySecondary] } = await db.is_users
          .findBySecondaryIndex(
            "age",
            mockUser1.age,
          );

        assert(byPrimary !== null);
        assert(byPrimary.value.username === mockUser1.username);
        assert(byPrimary.value.address.country === mockUser1.address.country);
        assert(byPrimary.value.address.city === mockUser1.address.city);
        assert(byPrimary.value.address.houseNr === mockUser1.address.houseNr);
        assert(byPrimary.value.address.street === mockUser1.address.street);

        assert(bySecondary !== null);
        assert(bySecondary.value.username === mockUser1.username);
        assert(bySecondary.value.address.country === mockUser1.address.country);
        assert(bySecondary.value.address.city === mockUser1.address.city);
        assert(bySecondary.value.address.houseNr === mockUser1.address.houseNr);
        assert(bySecondary.value.address.street === mockUser1.address.street);
      });
    },
  );

  await t.step("Should successfully parse and update", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10);
      let assertion = true;

      const cr = await db.zis_users.addMany(users);
      assert(cr.ok);

      await db.zis_users.updateMany(mockUser1).catch(() => assertion = false);

      assert(assertion);
    });
  });

  await t.step("Should fail to parse and update document", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10);
      let assertion = false;

      const cr = await db.zis_users.addMany(users);
      assert(cr.ok);

      await db.zis_users.updateMany(mockUserInvalid).catch(() =>
        assertion = true
      );

      assert(assertion);
    });
  });

  await t.step(
    "Should update multiple documents with multi-part id using replace",
    async () => {
      await useDb(async (db) => {
        const users = [mockUser1, mockUser2, mockUser3];
        const cr = await db.is_multi_part_id_users.addMany(users);
        assert(cr.ok);

        const docs = await db.is_multi_part_id_users.getMany();
        const ids = docs.result.map((doc) => doc.id);
        const versionstamps = docs.result.map((doc) => doc.versionstamp);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const { result } = await db.is_multi_part_id_users.updateMany(
          updateData,
          { strategy: "merge-shallow" },
        );

        assert(
          result.every((cr) =>
            cr.ok &&
            ids.some((id) => keyEq(id as KvKey, cr.id as KvKey)) &&
            !versionstamps.includes(cr.versionstamp)
          ),
        );

        await db.is_multi_part_id_users.forEach((doc) => {
          assert(doc.value.address.country === updateData.address.country);
          assert(doc.value.address.city === updateData.address.city);
          assert(doc.value.address.houseNr === updateData.address.houseNr);
        });
      });
    },
  );
});
