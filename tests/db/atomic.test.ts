import { collection, kvdex, QueueMessage, QueueValue } from "../../mod.ts"
import { createHandlerId } from "../../src/utils.ts"
import { assert } from "../deps.ts"
import { mockUser1, mockUser2 } from "../mocks.ts"
import { sleep, useDb, useKv } from "../utils.ts"

Deno.test("db - atomic", async (t) => {
  await t.step("Should add documents to collection", async () => {
    await useDb(async (db) => {
      const cr = await db
        .atomic((schema) => schema.users)
        .add(mockUser1)
        .add(mockUser2)
        .commit()

      assert(cr.ok)

      const count = await db.users.count()
      assert(count === 2)
    })
  })

  await t.step(
    "Should only set first document with colliding ids",
    async () => {
      await useDb(async (db) => {
        const id = "id"

        const cr = await db
          .atomic((schema) => schema.users)
          .set(id, mockUser1)
          .set(id, mockUser2)
          .commit()

        assert(cr.ok)

        const count = await db.users.count()
        assert(count === 1)
      })
    },
  )

  await t.step("Should delete document", async () => {
    await useDb(async (db) => {
      const cr1 = await db.users.add(mockUser1)
      assert(cr1.ok)

      const cr2 = await db
        .atomic((schema) => schema.users)
        .delete(cr1.id)
        .commit()

      assert(cr2.ok)

      const count = await db.users.count()
      const doc = await db.users.find(cr1.id)
      assert(count === 0)
      assert(doc === null)
    })
  })

  await t.step("Should perform sum operation", async () => {
    await useDb(async (db) => {
      const initial = 100n
      const additional = 10n

      const cr1 = await db.u64s.add(new Deno.KvU64(initial))
      assert(cr1.ok)

      const cr2 = await db
        .atomic((schema) => schema.u64s)
        .sum(cr1.id, additional)
        .commit()

      assert(cr2.ok)

      const doc = await db.u64s.find(cr1.id)
      assert(doc?.value.value === initial + additional)
    })
  })

  await t.step(
    "Should perform min operation and set document value to the given value",
    async () => {
      await useDb(async (db) => {
        const initial = 100n
        const min = 10n

        const cr1 = await db.u64s.add(new Deno.KvU64(initial))
        assert(cr1.ok)

        const cr2 = await db
          .atomic((schema) => schema.u64s)
          .min(cr1.id, min)
          .commit()

        assert(cr2.ok)

        const doc = await db.u64s.find(cr1.id)
        assert(doc?.value.value === min)
      })
    },
  )

  await t.step(
    "Should perform min operation and set document value to the existing value",
    async () => {
      await useDb(async (db) => {
        const initial = 100n
        const min = 200n

        const cr1 = await db.u64s.add(new Deno.KvU64(initial))
        assert(cr1.ok)

        const cr2 = await db
          .atomic((schema) => schema.u64s)
          .min(cr1.id, min)
          .commit()

        assert(cr2.ok)

        const doc = await db.u64s.find(cr1.id)
        assert(doc?.value.value === initial)
      })
    },
  )

  await t.step(
    "Should perform max operation and set document value to the given value",
    async () => {
      await useDb(async (db) => {
        const initial = 100n
        const max = 200n

        const cr1 = await db.u64s.add(new Deno.KvU64(initial))
        assert(cr1.ok)

        const cr2 = await db
          .atomic((schema) => schema.u64s)
          .max(cr1.id, max)
          .commit()

        assert(cr2.ok)

        const doc = await db.u64s.find(cr1.id)
        assert(doc?.value.value === max)
      })
    },
  )

  await t.step(
    "Should perform max operation and set document value to the existing value",
    async () => {
      await useDb(async (db) => {
        const initial = 100n
        const max = 10n

        const cr1 = await db.u64s.add(new Deno.KvU64(initial))
        assert(cr1.ok)

        const cr2 = await db
          .atomic((schema) => schema.u64s)
          .max(cr1.id, max)
          .commit()

        assert(cr2.ok)

        const doc = await db.u64s.find(cr1.id)
        assert(doc?.value.value === initial)
      })
    },
  )

  await t.step("Should perform mutation operations", async () => {
    await useDb(async (db) => {
      const initial = new Deno.KvU64(100n)
      const value = new Deno.KvU64(200n)
      const id = "id"
      const addition = new Deno.KvU64(100n)
      const min1 = new Deno.KvU64(10n)
      const min2 = new Deno.KvU64(200n)
      const max1 = new Deno.KvU64(200n)
      const max2 = new Deno.KvU64(10n)

      const cr1 = await db.u64s.add(initial)
      const cr2 = await db.u64s.add(initial)
      const cr3 = await db.u64s.add(initial)
      const cr4 = await db.u64s.add(initial)
      const cr5 = await db.u64s.add(initial)
      const cr6 = await db.u64s.add(initial)

      assert(cr1.ok && cr2.ok && cr3.ok && cr4.ok && cr5.ok && cr6.ok)

      await db
        .atomic((schema) => schema.u64s)
        .mutate(
          {
            id,
            type: "set",
            value,
          },
          {
            id: cr1.id,
            type: "sum",
            value: addition,
          },
          {
            id: cr2.id,
            type: "min",
            value: min1,
          },
          {
            id: cr3.id,
            type: "min",
            value: min2,
          },
          {
            id: cr4.id,
            type: "max",
            value: max1,
          },
          {
            id: cr5.id,
            type: "max",
            value: max2,
          },
          {
            id: cr6.id,
            type: "delete",
          },
        )
        .commit()

      const docNew = await db.u64s.find(id)
      const doc1 = await db.u64s.find(cr1.id)
      const doc2 = await db.u64s.find(cr2.id)
      const doc3 = await db.u64s.find(cr3.id)
      const doc4 = await db.u64s.find(cr4.id)
      const doc5 = await db.u64s.find(cr5.id)
      const doc6 = await db.u64s.find(cr6.id)

      assert(docNew?.value.value === value.value)
      assert(doc1?.value.value === initial.value + addition.value)
      assert(doc2?.value.value === min1.value)
      assert(doc3?.value.value === initial.value)
      assert(doc4?.value.value === max1.value)
      assert(doc5?.value.value === initial.value)
      assert(doc6 === null)
    })
  })

  await t.step("Should enqueue message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data"
      const undeliveredId = "undelivered"

      const db = kvdex(kv, {
        numbers: collection<number>().build(),
      })

      const handlerId = createHandlerId(db.numbers._keys.baseKey, undefined)

      let assertion = false

      kv.listenQueue((msg) => {
        const qMsg = msg as QueueMessage<QueueValue>
        assertion = qMsg.__handlerId__ === handlerId && qMsg.__data__ === data
      })

      await db
        .atomic((schema) => schema.numbers)
        .enqueue("data", {
          idsIfUndelivered: [undeliveredId],
        })
        .commit()

      await sleep(100)

      const undelivered = await db.numbers.findUndelivered(undeliveredId)
      assert(assertion || typeof undelivered?.value === typeof data)
    })
  })
})
