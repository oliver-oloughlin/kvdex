import { collection, kvdex, model } from "../../mod.ts";
import { assert, assertEquals } from "../test.deps.ts";
import { mockUser1, mockUser2, mockUserInvalid } from "../mocks.ts";
import { useDb, useKv } from "../utils.ts";

Deno.test("collection - update", async (t) => {
  await t.step(
    "Should update document of KvObject type using shallow merge",
    async () => {
      await useDb(async (db) => {
        const cr = await db.users.add(mockUser1);
        assert(cr.ok);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const updateCr = await db.users.update(cr.id, updateData, {
          strategy: "merge-shallow",
        });

        assert(updateCr.ok);
        assert(updateCr.id === cr.id);
        assert(updateCr.versionstamp !== cr.versionstamp);

        const doc = await db.users.find(cr.id);

        assert(doc !== null);
        assert(doc.value.username === mockUser1.username);
        assert(doc.value.age === mockUser1.age);
        assert(doc.value.address.country === updateData.address.country);
        assert(doc.value.address.city === updateData.address.city);
        assert(doc.value.address.houseNr === updateData.address.houseNr);
        assert(typeof doc.value.address.street === "undefined");
      });
    },
  );

  await t.step(
    "Should update document of KvObject type using deep merge",
    async () => {
      await useDb(async (db) => {
        const cr = await db.users.add(mockUser1);
        assert(cr.ok);

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        };

        const updateCr = await db.users.update(cr.id, updateData, {
          strategy: "merge",
        });

        assert(updateCr.ok);
        assert(updateCr.id === cr.id);
        assert(updateCr.versionstamp !== cr.versionstamp);

        const doc = await db.users.find(cr.id);

        assert(doc !== null);
        assert(doc.value.username === mockUser1.username);
        assert(doc.value.age === mockUser1.age);
        assert(doc.value.address.country === updateData.address.country);
        assert(doc.value.address.city === updateData.address.city);
        assert(doc.value.address.houseNr === updateData.address.houseNr);
        assert(doc.value.address.street === mockUser1.address.street);
      });
    },
  );

  await t.step(
    "Should update document of KvObject type using replace",
    async () => {
      await useDb(async (db) => {
        const cr = await db.users.add(mockUser1);
        assert(cr.ok);

        const updateCr = await db.users.update(cr.id, mockUser2, {
          strategy: "replace",
        });

        assert(updateCr.ok);
        assert(updateCr.id === cr.id);
        assert(updateCr.versionstamp !== cr.versionstamp);

        const doc = await db.users.find(cr.id);

        assert(doc !== null);
        assert(doc.value.username === mockUser2.username);
        assert(doc.value.age === mockUser2.age);
        assert(doc.value.address.country === mockUser2.address.country);
        assert(doc.value.address.city === mockUser2.address.city);
        assert(doc.value.address.houseNr === mockUser2.address.houseNr);
        assert(doc.value.address.street === mockUser2.address.street);
      });
    },
  );

  await t.step(
    "Should update documents of type Array, Set and Map using merge",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          arrays: collection(model<number[]>()),
          sets: collection(model<Set<number>>()),
          maps: collection(model<Map<string, number>>()),
        });

        const val1 = [1, 2, 4];
        const setEntries = [1, 2, 4];
        const val2 = new Set(setEntries);
        const mapEntries = [["1", 1], ["2", 2], ["4", 4]] as const;
        const val3 = new Map(mapEntries);

        const cr1 = await db.arrays.add(val1);
        const cr2 = await db.sets.add(val2);
        const cr3 = await db.maps.add(val3);

        assert(cr1.ok);
        assert(cr2.ok);
        assert(cr3.ok);

        const u1 = [1, 3, 5];
        const uSetEntries = [1, 3, 5];
        const u2 = new Set(uSetEntries);
        const uMapEntries = [["1", 1], ["3", 3], ["5", 5]] as const;
        const u3 = new Map(uMapEntries);

        const updateCr1 = await db.arrays.update(cr1.id, u1, {
          strategy: "merge",
        });

        const updateCr2 = await db.sets.update(cr2.id, u2, {
          strategy: "merge",
        });

        const updateCr3 = await db.maps.update(cr3.id, u3, {
          strategy: "merge",
        });

        assert(updateCr1.ok);
        assert(updateCr2.ok);
        assert(updateCr3.ok);

        const doc1 = await db.arrays.find(cr1.id);
        const doc2 = await db.sets.find(cr2.id);
        const doc3 = await db.maps.find(cr3.id);

        assert(doc1 !== null);
        assert(doc2 !== null);
        assert(doc3 !== null);
        assertEquals(doc1.value, [...val1, ...u1]);
        assertEquals(doc2.value, new Set([...setEntries, ...uSetEntries]));
        assertEquals(doc3.value, new Map([...mapEntries, ...uMapEntries]));
      });
    },
  );

  await t.step(
    "Should update documents of primitive and built-in object types using replace",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          numbers: collection(model<number>()),
          strings: collection(model<string>()),
          dates: collection(model<Date>()),
        });

        const cr1 = await db.numbers.add(10);
        const cr2 = await db.strings.add("10");
        const cr3 = await db.dates.add(new Date("2000-01-01"));
        assert(cr1.ok && cr2.ok && cr3.ok);

        const val1 = 20;
        const val2 = "20";
        const val3 = new Date("2016-01-01");

        const updateCr1 = await db.numbers.update(cr1.id, val1);
        const updateCr2 = await db.strings.update(cr2.id, val2);
        const updateCr3 = await db.dates.update(cr3.id, val3);
        assert(updateCr1.ok && updateCr2.ok && updateCr3.ok);
        assert(updateCr1.id === cr1.id);
        assert(updateCr1.versionstamp !== cr1.versionstamp);
        assert(updateCr2.id === cr2.id);
        assert(updateCr2.versionstamp !== cr2.versionstamp);
        assert(updateCr3.id === cr3.id);
        assert(updateCr3.versionstamp !== cr3.versionstamp);

        const doc1 = await db.numbers.find(cr1.id);
        const doc2 = await db.strings.find(cr2.id);
        const doc3 = await db.dates.find(cr3.id);
        assert(doc1 !== null && doc2 !== null && doc3 !== null);

        assert(doc1.value === val1);
        assert(doc2.value === val2);
        assert(doc3.value.valueOf() === val3.valueOf());
      });
    },
  );

  await t.step("Should successfully parse and update document", async () => {
    await useDb(async (db) => {
      let assertion = true;

      const cr = await db.z_users.add(mockUser1);
      assert(cr.ok);

      await db.z_users.update(cr.id, mockUser2).catch(() => assertion = false);

      assert(assertion);
    });
  });

  await t.step("Should fail to parse and update document", async () => {
    await useDb(async (db) => {
      let assertion = false;

      const cr = await db.z_users.add(mockUser1);
      assert(cr.ok);

      await db.z_users.update(cr.id, mockUserInvalid).catch(() =>
        assertion = true
      );

      assert(assertion);
    });
  });
});
