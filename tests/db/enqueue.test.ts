import { collection, kvdex, KvValue, QueueMessage } from "../../mod.ts"
import { assert } from "../deps.ts"
import { sleep, useKv } from "../utils.ts"

Deno.test("db - enqueue", async (t) => {
  await t.step("Should enqueue message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data"
      const undeliveredId = "undelivered"

      const db = kvdex(kv, {
        numbers: collection<number>().build(),
      })

      let assertion = false

      kv.listenQueue((msg) => {
        const qMsg = msg as QueueMessage<KvValue>
        assertion = qMsg.collectionKey !== null && qMsg.data === data
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
