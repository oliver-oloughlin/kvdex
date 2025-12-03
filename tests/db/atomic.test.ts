import {
  collection,
  kvdex,
  type KvValue,
  model,
  type QueueMessage,
} from "../../mod.ts";
import { createHandlerId } from "../../src/core/utils.ts";
import { assert, assertEquals, assertThrows } from "@std/assert";
import { mockUser1, mockUser2, mockUserInvalid } from "../mocks.ts";
import { sleep, useDb, useKv } from "../utils.ts";

Deno.test("db - atomic", async (t) => {
  await t.step("Should add documents to collection", async () => {
    await useDb(async (db) => {
      const cr = await db
        .atomic((schema) => schema.users)
        .add(mockUser1)
        .add(mockUser2)
        .commit();

      assert(cr.ok);

      const count = await db.users.count();
      assert(count === 2);
    });
  });

  await t.step(
    "Should only set first document with colliding ids",
    async () => {
      await useDb(async (db) => {
        const id = "id";

        const cr = await db
          .atomic((schema) => schema.users)
          .set(id, mockUser1)
          .set(id, mockUser2)
          .commit();

        assert(cr.ok);

        const count = await db.users.count();
        assert(count === 1);
      });
    },
  );

  await t.step("Should overwrite document in standard collection", async () => {
    await useDb(async (db) => {
      const cr1 = await db.users.add(mockUser1);
      assert(cr1.ok);

      const cr2 = await db
        .atomic((schema) => schema.users)
        .set(cr1.id, mockUser2, { overwrite: true })
        .commit();

      assert(cr2.ok);

      const count = await db.users.count();
      assert(count === 1);

      const doc = await db.users.find(cr1.id);
      assertEquals(doc?.value, mockUser2);
    });
  });

  await t.step(
    "Should throw when trying to overwrite document in indexable collection",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.i_users.add(mockUser1);
        assert(cr1.ok);

        assertThrows(() => {
          db
            .atomic((schema) => schema.i_users)
            .set(cr1.id, mockUser2, { overwrite: true } as any);
        });
      });
    },
  );

  await t.step("Should delete document", async () => {
    await useDb(async (db) => {
      const cr1 = await db.users.add(mockUser1);
      assert(cr1.ok);

      const cr2 = await db
        .atomic((schema) => schema.users)
        .delete(cr1.id)
        .commit();

      assert(cr2.ok);

      const count = await db.users.count();
      const doc = await db.users.find(cr1.id);
      assert(count === 0);
      assert(doc === null);
    });
  });

  await t.step("Should perform sum operation", async () => {
    await useDb(async (db) => {
      const initial = 100n;
      const additional = 10n;

      const cr1 = await db.u64s.add(new Deno.KvU64(initial));
      assert(cr1.ok);

      const cr2 = await db
        .atomic((schema) => schema.u64s)
        .sum(cr1.id, additional)
        .commit();

      assert(cr2.ok);

      const doc = await db.u64s.find(cr1.id);
      assert(doc?.value.value === initial + additional);
    });
  });

  await t.step(
    "Should perform min operation and set document value to the given value",
    async () => {
      await useDb(async (db) => {
        const initial = 100n;
        const min = 10n;

        const cr1 = await db.u64s.add(new Deno.KvU64(initial));
        assert(cr1.ok);

        const cr2 = await db
          .atomic((schema) => schema.u64s)
          .min(cr1.id, min)
          .commit();

        assert(cr2.ok);

        const doc = await db.u64s.find(cr1.id);
        assert(doc?.value.value === min);
      });
    },
  );

  await t.step(
    "Should perform min operation and set document value to the existing value",
    async () => {
      await useDb(async (db) => {
        const initial = 100n;
        const min = 200n;

        const cr1 = await db.u64s.add(new Deno.KvU64(initial));
        assert(cr1.ok);

        const cr2 = await db
          .atomic((schema) => schema.u64s)
          .min(cr1.id, min)
          .commit();

        assert(cr2.ok);

        const doc = await db.u64s.find(cr1.id);
        assert(doc?.value.value === initial);
      });
    },
  );

  await t.step(
    "Should perform max operation and set document value to the given value",
    async () => {
      await useDb(async (db) => {
        const initial = 100n;
        const max = 200n;

        const cr1 = await db.u64s.add(new Deno.KvU64(initial));
        assert(cr1.ok);

        const cr2 = await db
          .atomic((schema) => schema.u64s)
          .max(cr1.id, max)
          .commit();

        assert(cr2.ok);

        const doc = await db.u64s.find(cr1.id);
        assert(doc?.value.value === max);
      });
    },
  );

  await t.step(
    "Should perform max operation and set document value to the existing value",
    async () => {
      await useDb(async (db) => {
        const initial = 100n;
        const max = 10n;

        const cr1 = await db.u64s.add(new Deno.KvU64(initial));
        assert(cr1.ok);

        const cr2 = await db
          .atomic((schema) => schema.u64s)
          .max(cr1.id, max)
          .commit();

        assert(cr2.ok);

        const doc = await db.u64s.find(cr1.id);
        assert(doc?.value.value === initial);
      });
    },
  );

  await t.step("Should perform mutation operations", async () => {
    await useDb(async (db) => {
      const initial = new Deno.KvU64(100n);
      const set = new Deno.KvU64(200n);
      const add = new Deno.KvU64(300n);
      const id = "id";
      const sum = new Deno.KvU64(100n);
      const min1 = new Deno.KvU64(10n);
      const min2 = new Deno.KvU64(200n);
      const max1 = new Deno.KvU64(200n);
      const max2 = new Deno.KvU64(10n);

      const cr1 = await db.u64s.add(initial);
      const cr2 = await db.u64s.add(initial);
      const cr3 = await db.u64s.add(initial);
      const cr4 = await db.u64s.add(initial);
      const cr5 = await db.u64s.add(initial);
      const cr6 = await db.u64s.add(initial);

      assert(cr1.ok && cr2.ok && cr3.ok && cr4.ok && cr5.ok && cr6.ok);

      await db
        .atomic((schema) => schema.u64s)
        .mutate(
          {
            id,
            type: "set",
            value: set,
          },
          {
            id,
            type: "add",
            value: add,
          },
          {
            id: cr1.id,
            type: "sum",
            value: sum.value,
          },
          {
            id: cr2.id,
            type: "min",
            value: min1.value,
          },
          {
            id: cr3.id,
            type: "min",
            value: min2.value,
          },
          {
            id: cr4.id,
            type: "max",
            value: max1.value,
          },
          {
            id: cr5.id,
            type: "max",
            value: max2.value,
          },
          {
            id: cr6.id,
            type: "delete",
          },
        )
        .commit();

      const docSet = await db.u64s.find(id);

      const { result: [docAdd] } = await db.u64s.getMany({
        filter: (d) => d.value.value === 300n,
      });

      const doc1 = await db.u64s.find(cr1.id);
      const doc2 = await db.u64s.find(cr2.id);
      const doc3 = await db.u64s.find(cr3.id);
      const doc4 = await db.u64s.find(cr4.id);
      const doc5 = await db.u64s.find(cr5.id);
      const doc6 = await db.u64s.find(cr6.id);

      assert(docSet?.value.value === set.value);
      assert(docAdd?.value.value === add.value);
      assert(doc1?.value.value === initial.value + sum.value);
      assert(doc2?.value.value === min1.value);
      assert(doc3?.value.value === initial.value);
      assert(doc4?.value.value === max1.value);
      assert(doc5?.value.value === initial.value);
      assert(doc6 === null);
    });
  });

  await t.step("Should enqueue message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data";
      const undeliveredId = "undelivered";

      const db = kvdex({
        kv,
        schema: { numbers: collection(model<number>()) },
      });

      const handlerId = createHandlerId(db.numbers["keys"].base, undefined);

      let assertion = false;

      const listener = kv.listenQueue((msg) => {
        const qMsg = msg as QueueMessage<KvValue>;
        assertion = qMsg.__handlerId__ === handlerId && qMsg.__data__ === data;
      });

      await db
        .atomic((schema) => schema.numbers)
        .enqueue("data", {
          idsIfUndelivered: [undeliveredId],
        })
        .commit();

      await sleep(100);

      const undelivered = await db.numbers.findUndelivered(undeliveredId);
      assert(assertion || typeof undelivered?.value === typeof data);

      return async () => await listener;
    });
  });

  await t.step("Should successfully parse and add documents", async () => {
    await useDb(async (db) => {
      const cr1 = await db
        .atomic((schema) => schema.z_users)
        .add(mockUser1)
        .commit();

      const cr2 = await db
        .atomic((schema) => schema.users)
        .set("id2", mockUser1)
        .commit();

      const cr3 = await db
        .atomic((schema) => schema.users)
        .mutate({
          type: "set",
          id: "id3",
          value: mockUser1,
        })
        .commit();

      assert(cr1.ok);
      assert(cr2.ok);
      assert(cr3.ok);
    });
  });

  await t.step("Should fail to parse and adding documents", async () => {
    await useDb(async (db) => {
      let assertion1 = false;
      let assertion2 = false;
      let assertion3 = false;

      try {
        await db
          .atomic((schema) => schema.z_users)
          .add(mockUserInvalid)
          .commit();
      } catch (_) {
        assertion1 = true;
      }

      try {
        await db
          .atomic((schema) => schema.z_users)
          .set("id2", mockUserInvalid)
          .commit();
      } catch (_) {
        assertion2 = true;
      }

      try {
        await db
          .atomic((schema) => schema.z_users)
          .mutate({
            type: "set",
            id: "id3",
            value: mockUserInvalid,
          })
          .commit();
      } catch (_) {
        assertion3 = true;
      }

      assert(assertion1);
      assert(assertion2);
      assert(assertion3);
    });
  });

  await t.step("Should retain history in correct order", async () => {
    await useKv(async (kv) => {
      const db = kvdex({
        kv,
        schema: { numbers: collection(model<number>(), { history: true }) },
      });

      const id = "id";

      await db
        .atomic((s) => s.numbers)
        .add(100)
        .set(id, 200)
        .commit();

      await sleep(10);

      await db
        .atomic((s) => s.numbers)
        .delete(id)
        .commit();

      const { result: [doc] } = await db.numbers.getMany({
        filter: (d) => d.value === 100,
      });

      const { result: [h] } = await db.numbers.findHistory(doc.id);
      assert(h.type === "write");
      assert(h.value === 100);

      const { result: [h1, h2] } = await db.numbers.findHistory(id);

      assert(h1.type === "write");
      assert(h1.value === 200);
      assert(h1.timestamp.valueOf() <= h2.timestamp.valueOf());
      assert(h2.type === "delete");
    });
  });
});
