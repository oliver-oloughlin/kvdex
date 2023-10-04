import { kvdex, largeCollection, QueueMessage, QueueValue } from "../../mod.ts"
import { createHandlerId } from "../../src/utils.ts"
import { assert } from "../deps.ts"
import { User } from "../models.ts"
import { sleep, useDb, useKv } from "../utils.ts"

Deno.test("large_collection - enqueue", async (t) => {
  await t.step("Should enqueue message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data"
      const undeliveredId = "undelivered"

      const db = kvdex(kv, {
        l_users: largeCollection<User>().build(),
      })

      const handlerId = createHandlerId(db.l_users._keys.baseKey, undefined)

      let assertion = false

      kv.listenQueue((msg) => {
        const qMsg = msg as QueueMessage<QueueValue>
        assertion = qMsg.__handlerId__ === handlerId && qMsg.__data__ === data
      })

      await db.l_users.enqueue(data, {
        idsIfUndelivered: [undeliveredId],
      })

      await sleep(100)

      const undelivered = await db.l_users.findUndelivered(undeliveredId)
      assert(assertion || typeof undelivered?.value === typeof data)
    })
  })

  await t.step("Should enqueue message in correct topic", async () => {
    await useDb(async (db) => {
      const data = "data"
      const undeliveredId = "undelivered"
      const topic = "topic"

      let assertion1 = false
      let assertion2 = true

      db.l_users.listenQueue(() => assertion1 = true, { topic })

      db.l_users.listenQueue(() => assertion2 = false)

      await db.l_users.enqueue("data", {
        idsIfUndelivered: [undeliveredId],
        topic,
      })

      await sleep(100)

      const undelivered = await db.l_users.findUndelivered(undeliveredId)
      assert(assertion1 || typeof undelivered?.value === typeof data)
      assert(assertion2)
    })
  })
})
