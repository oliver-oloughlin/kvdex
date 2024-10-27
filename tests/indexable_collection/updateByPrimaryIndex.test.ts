import type { Document } from "../../mod.ts";
import { assert } from "../test.deps.ts";
import { mockUser1, mockUser2, mockUserInvalid } from "../mocks.ts";
import type { User } from "../models.ts";
import { useDb } from "../utils.ts";

Deno.test("indexable_collection - updateByPrimaryIndex", async (t) => {
  await t.step(
    "Should update document of KvObject type using shallow merge",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.add(mockUser1);
        assert(cr.ok);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const updateCr = await db.i_users.updateByPrimaryIndex(
          "username",
          mockUser1.username,
          updateData,
          {
            strategy: "merge-shallow",
          },
        );

        const byId = await db.i_users.find(cr.id);

        const byPrimary = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        );

        const bySecondary = await db.i_users.findBySecondaryIndex(
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
        const cr = await db.i_users.add(mockUser1);
        assert(cr.ok);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const updateCr = await db.i_users.updateByPrimaryIndex(
          "username",
          mockUser1.username,
          updateData,
          {
            strategy: "merge",
          },
        );

        const byId = await db.i_users.find(cr.id);

        const byPrimary = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        );

        const bySecondary = await db.i_users.findBySecondaryIndex(
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
        const cr = await db.i_users.add(mockUser1);
        assert(cr.ok);

        const updateCr = await db.i_users.updateByPrimaryIndex(
          "username",
          mockUser1.username,
          mockUser2,
          {
            strategy: "replace",
          },
        );

        const byId = await db.i_users.find(cr.id);

        const byPrimary = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser2.username,
        );

        const bySecondary = await db.i_users.findBySecondaryIndex(
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

  await t.step("Should successfully parse and update document", async () => {
    await useDb(async (db) => {
      let assertion = true;

      const cr = await db.zi_users.add(mockUser1);
      assert(cr.ok);

      await db.zi_users.updateByPrimaryIndex(
        "username",
        mockUser1.username,
        mockUser2,
      ).catch(() => assertion = false);

      assert(assertion);
    });
  });

  await t.step("Should fail to parse and update document", async () => {
    await useDb(async (db) => {
      let assertion = false;

      const cr = await db.zi_users.add(mockUser1);
      assert(cr.ok);

      await db.zi_users.updateByPrimaryIndex(
        "username",
        mockUser1.username,
        mockUserInvalid,
      ).catch(() => assertion = true);

      assert(assertion);
    });
  });
});
