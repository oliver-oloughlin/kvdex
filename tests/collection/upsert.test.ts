import { assert } from "../test.deps.ts";
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts";
import type { User } from "../models.ts";
import { useDb } from "../utils.ts";

Deno.test("collection - upsert", async (t) => {
  await t.step("Should set new doucment entry by id", async () => {
    await useDb(async (db) => {
      const id = "id";

      const cr = await db.users.upsert({
        id: id,
        set: mockUser2,
        update: mockUser3,
      });

      assert(cr.ok);

      const doc = await db.users.find(id);
      assert(doc !== null);
      assert(doc.value.username === mockUser2.username);
    });
  });

  await t.step(
    "Should update existing document entry by id using shallow merge",
    async () => {
      await useDb(async (db) => {
        const id = "id";

        const cr1 = await db.users.set(id, mockUser1);
        assert(cr1.ok);

        const updateData: Partial<User> = {
          address: {
            country: "England",
            city: "London",
            houseNr: null,
          },
        };

        const cr2 = await db.users.upsert({
          id: id,
          set: mockUser2,
          update: updateData,
        }, {
          strategy: "merge-shallow",
        });

        assert(cr2.ok);

        const doc = await db.users.find(id);
        assert(doc !== null);
        assert(doc.value.username === mockUser1.username);
        assert(doc.value.age === mockUser1.age);
        assert(doc.value.address.city === updateData.address?.city);
        assert(doc.value.address.country === updateData.address.country);
        assert(doc.value.address.houseNr === updateData.address.houseNr);
        assert(doc.value.address.street === undefined);
      });
    },
  );

  await t.step(
    "Should update existing document entry by id using deep merge",
    async () => {
      await useDb(async (db) => {
        const id = "id";

        const cr1 = await db.users.set(id, mockUser1);
        assert(cr1.ok);

        const updateData: Partial<User> = {
          address: {
            country: "England",
            city: "London",
            houseNr: null,
          },
        };

        const cr2 = await db.users.upsert({
          id: id,
          set: mockUser2,
          update: updateData,
        }, {
          strategy: "merge",
        });

        assert(cr2.ok);

        const doc = await db.users.find(id);
        assert(doc !== null);
        assert(doc.value.username === mockUser1.username);
        assert(doc.value.age === mockUser1.age);
        assert(doc.value.address.city === updateData.address?.city);
        assert(doc.value.address.country === updateData.address.country);
        assert(doc.value.address.houseNr === updateData.address.houseNr);
        assert(doc.value.address.street === mockUser1.address.street);
      });
    },
  );

  await t.step(
    "Should update existing document entry by id using replace",
    async () => {
      await useDb(async (db) => {
        const id = "id";

        const cr1 = await db.users.set(id, mockUser1);
        assert(cr1.ok);

        const cr2 = await db.users.upsert({
          id: id,
          set: mockUser2,
          update: mockUser3,
        }, {
          strategy: "replace",
        });

        assert(cr2.ok);

        const doc = await db.users.find(id);
        assert(doc !== null);
        assert(doc.value.username === mockUser3.username);
        assert(doc.value.age === mockUser3.age);
        assert(doc.value.address.city === mockUser3.address?.city);
        assert(doc.value.address.country === mockUser3.address.country);
        assert(doc.value.address.houseNr === mockUser3.address.houseNr);
        assert(doc.value.address.street === mockUser3.address.street);
      });
    },
  );
});
