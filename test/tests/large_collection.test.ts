import { assert } from "../deps.ts"
import { db, kv, LargeData, reset, sleep, useTemporaryKv } from "../config.ts"
import { testLargeData, testLargeData2 } from "../large_data.ts"
import { kvdex, KvId, QueueMessage } from "../../mod.ts"
import {
  COLLECTION_ID_KEY_SUFFIX,
  COLLECTION_SEGMENT_KEY_SUFFIX,
  KVDEX_KEY_PREFIX,
} from "../../src/constants.ts"

Deno.test("large_collection", async (t) => {
  // Test correctness of collection keys
  await t.step("keys", async (t) => {
    await t.step("Collection keys should have kvdex prefix", () => {
      const keys = Object.entries(db.largeDocs.keys).map(([_, key]) => key)
      assert(keys.every((key) => key[0] === KVDEX_KEY_PREFIX))
    })

    await t.step("Id key should have id key suffix", () => {
      const idKey = db.largeDocs.keys.idKey
      const suffix = idKey[idKey.length - 1]
      assert(suffix === COLLECTION_ID_KEY_SUFFIX)
    })

    await t.step("Segment key should have segment key suffix", () => {
      const segmentKey = db.largeDocs.keys.segmentKey
      const suffix = segmentKey[segmentKey.length - 1]
      assert(suffix === COLLECTION_SEGMENT_KEY_SUFFIX)
    })
  })

  // Test "add" method
  await t.step("add", async (t) => {
    await t.step(
      "Should add new document entry with generated id",
      async () => {
        await reset()

        const cr = await db.largeDocs.add(testLargeData)
        assert(cr.ok)

        const largeDoc = await db.largeDocs.find(cr.id)

        assert(largeDoc !== null)
        assert(typeof largeDoc.id === "string")
        assert(typeof largeDoc.value === "object")
        assert(largeDoc.value.name === testLargeData.name)
      },
    )
  })

  // Test "addMany" method
  await t.step("addMany", async (t) => {
    await t.step("Should find multiple documents by ids", async () => {
      const [cr1, cr2] = await db.largeDocs.addMany(
        testLargeData,
        testLargeData,
      )
      assert(cr1.ok && cr2.ok)

      const docs = await db.largeDocs.findMany([cr1.id, cr2.id])
      assert(docs.length === 2)
      assert(docs.some((doc) => doc.id === cr1.id))
      assert(docs.some((doc) => doc.id === cr2.id))
    })
  })

  // Test "set" method
  await t.step("set", async (t) => {
    await t.step("Should set new document entry with given id", async () => {
      await reset()

      const cr = await db.largeDocs.set(100n, testLargeData)
      assert(cr.ok)

      const largeDoc = await db.largeDocs.find(cr.id)

      assert(largeDoc !== null)
      assert(typeof largeDoc.id === "bigint")
      assert(typeof largeDoc.value === "object")
      assert(largeDoc.value.name === testLargeData.name)
    })

    await t.step(
      "Should not add document with id that already exists",
      async () => {
        await reset()

        const id = "id"

        const cr1 = await db.largeDocs.set(id, testLargeData)
        assert(cr1.ok)

        const cr2 = await db.largeDocs.set(id, testLargeData)
        assert(!cr2.ok)
      },
    )
  })

  // Test "find" method
  await t.step("find", async (t) => {
    await t.step("Should find document by id", async () => {
      await reset()

      const id = "id"

      const cr = await db.largeDocs.set(id, testLargeData)
      assert(cr.ok)

      const largeDoc = await db.largeDocs.find(id)

      assert(largeDoc !== null)
      assert(largeDoc.value.name === testLargeData.name)
    })

    await t.step("Should not find document by id", async () => {
      await reset()

      const doc = await db.largeDocs.find("non_existing_id")
      assert(doc === null)
    })
  })

  // Test "findMany" method
  await t.step("findMany", async (t) => {
    await t.step("Should find mutliple documents by ids", async () => {
      await reset()

      const [cr1, cr2] = await db.largeDocs.addMany(
        testLargeData,
        testLargeData,
      )
      assert(cr1.ok && cr2.ok)

      const docs = await db.largeDocs.findMany([cr1.id, cr2.id])
      assert(docs.length === 2)
      assert(docs.some((doc) => doc.id === cr1.id))
      assert(docs.some((doc) => doc.id === cr2.id))
    })
  })

  // Test "delete" method
  await t.step("delete", async (t) => {
    await t.step("Should delete document by id", async () => {
      await reset()

      const cr = await db.largeDocs.add(testLargeData)
      const count1 = await db.largeDocs.count()

      assert(cr.ok)
      assert(count1 === 1)

      await db.largeDocs.delete(cr.id)

      const count2 = await db.largeDocs.count()
      assert(count2 === 0)
    })
  })

  // Test "deleteMany" method
  await t.step("deleteMany", async (t) => {
    await t.step(
      "Should delete all document entries in the collection",
      async () => {
        await reset()

        const [cr1, cr2] = await db.largeDocs.addMany(
          testLargeData,
          testLargeData2,
        )
        assert(cr1.ok && cr2.ok)

        const count1 = await db.largeDocs.count()
        assert(count1 === 2)

        await db.largeDocs.deleteMany()

        const count2 = await db.largeDocs.count()
        assert(count2 === 0)

        const idIter = kv.list({ prefix: db.largeDocs.keys.idKey })
        const segmentIter = kv.list({ prefix: db.largeDocs.keys.segmentKey })

        const entries: unknown[] = []

        for await (const entry of idIter) {
          entries.push(entry.key)
        }

        for await (const entry of segmentIter) {
          entries.push(entry)
        }

        assert(entries.length === 0)
      },
    )
  })

  // Test "update" method
  await t.step("update", async (t) => {
    await t.step("Should perform partial update of document data", async () => {
      await reset()

      const cr1 = await db.largeDocs.add(testLargeData)
      assert(cr1.ok)

      const doc1 = await db.largeDocs.find(cr1.id)
      assert(doc1?.value.name === testLargeData.name)

      const cr2 = await db.largeDocs.update(cr1.id, {
        name: testLargeData2.name,
      })

      assert(cr2.ok)

      const doc2 = await db.largeDocs.find(cr1.id)
      assert(doc2?.value.name === testLargeData2.name)
      assert(doc2.value.numbers.length === doc1.value.numbers.length)
    })
  })

  // Test "getMany" method
  await t.step("getMany", async (t) => {
    await t.step(
      "Should get all document entries in the collection",
      async () => {
        await reset()

        const [cr1, cr2] = await db.largeDocs.addMany(
          testLargeData,
          testLargeData2,
        )
        assert(cr1.ok && cr2.ok)

        const { result } = await db.largeDocs.getMany()
        assert(result.some((doc) => doc.id === cr1.id))
        assert(result.some((doc) => doc.id === cr2.id))
      },
    )
  })

  // Test "map" method
  await t.step("map", async (t) => {
    await t.step(
      "Should correctly map all document entries in the collection",
      async () => {
        await reset()

        const [cr1, cr2] = await db.largeDocs.addMany(
          testLargeData,
          testLargeData2,
        )
        assert(cr1.ok && cr2.ok)

        const { result } = await db.largeDocs.map((doc) => doc.id)
        assert(result.some((id) => id === cr1.id))
        assert(result.some((id) => id === cr2.id))
      },
    )
  })

  // Test "forEach" method
  await t.step("forEach", async (t) => {
    await t.step(
      "Should execute callback function for all document entries in the collection",
      async () => {
        await reset()

        const [cr1, cr2] = await db.largeDocs.addMany(
          testLargeData,
          testLargeData2,
        )
        assert(cr1.ok && cr2.ok)

        const ids: KvId[] = []
        await db.largeDocs.forEach((doc) => ids.push(doc.id))

        assert(ids.some((id) => id === cr1.id))
        assert(ids.some((id) => id === cr2.id))
      },
    )
  })

  // Test "count" method
  await t.step("count", async (t) => {
    await t.step(
      "Should correctly count all document entries in the collection",
      async () => {
        await reset()

        const count1 = await db.largeDocs.count()
        assert(count1 === 0)

        const [cr1, cr2] = await db.largeDocs.addMany(
          testLargeData,
          testLargeData2,
        )
        assert(cr1.ok && cr2.ok)

        const count2 = await db.largeDocs.count()
        assert(count2 === 2)
      },
    )
  })

  // Test "enqueue" method
  await t.step("enqueue", async (t) => {
    await t.step("Should enqueue message with string data", async () => {
      await useTemporaryKv(async (kv) => {
        const data = "data"

        const db = kvdex(kv, {
          largeDocs: (ctx) => ctx.largeCollection<LargeData>().build(),
        })

        let assertion = false

        await db.largeDocs.enqueue("data")

        kv.listenQueue((msg) => {
          const qMsg = msg as QueueMessage
          assertion = qMsg.collectionKey !== null && qMsg.data === data
        })

        await sleep(500)
        assert(assertion)
      })
    })
  })

  // Test "listenQueue" method
  await t.step("listenQueue", async (t) => {
    await t.step("Should receive message with string data", async () => {
      await useTemporaryKv(async (kv) => {
        const data = "data"

        const db = kvdex(kv, {
          largeDocs: (ctx) => ctx.largeCollection<LargeData>().build(),
        })

        let assertion = false

        await kv.enqueue({
          collectionKey: db.largeDocs.keys.baseKey,
          data,
        } as QueueMessage)

        db.largeDocs.listenQueue((msgData) => {
          assertion = msgData === data
        })

        await sleep(500)
        assert(assertion)
      })
    })

    await t.step("Should not receive db queue message", async () => {
      await useTemporaryKv(async (kv) => {
        const data = "data"

        const db = kvdex(kv, {
          largeDocs: (ctx) => ctx.largeCollection<LargeData>().build(),
        })

        await db.enqueue(data)

        let assertion = true

        db.largeDocs.listenQueue(() => {
          assertion = false
        })

        await sleep(500)
        assert(assertion)
      })
    })
  })

  // Perform last reset
  await t.step("RESET", async () => await reset())
})
