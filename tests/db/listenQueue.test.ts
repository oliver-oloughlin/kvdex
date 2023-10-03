import { collection, kvdex, KvValue, QueueMessage } from "../../mod.ts"
import { assert } from "../deps.ts"
import { sleep, useKv } from "../utils.ts"

Deno.test("db - listenQueue", async (t) => {
  await t.step("Should receive message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data"
      const db = kvdex(kv, {})

      let assertion = false

      db.listenQueue((msgData) => {
        assertion = msgData === data
      })

      await kv.enqueue({
        collectionKey: null,
        data,
      } as QueueMessage<KvValue>)

      await sleep(100)
      assert(assertion)
    })
  })

  await t.step("Should not receive collection queue message", async () => {
    await useKv(async (kv) => {
      const data = "data"

      const db = kvdex(kv, {
        numbers: collection<number>().build(),
      })

      let assertion = true

      db.listenQueue(() => {
        assertion = false
      })

      await db.numbers.enqueue(data)

      await sleep(100)

      assert(assertion)
    })
  })
})
