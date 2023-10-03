import { indexableCollection, kvdex, KvValue, QueueMessage } from "../../mod.ts"
import { assert } from "../deps.ts"
import { User } from "../models.ts"
import { sleep, useKv } from "../utils.ts"

Deno.test("indexable_collection - enqueue", async (t) => {
  await t.step("Should enqueue message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data"
      const undeliveredId = "undelivered"

      const db = kvdex(kv, {
        i_users: indexableCollection<User>().build({ indices: {} }),
      })

      let assertion = false

      kv.listenQueue((msg) => {
        const qMsg = msg as QueueMessage<KvValue>
        assertion = qMsg.collectionKey !== null && qMsg.data === data
      })

      await db.i_users.enqueue(data, {
        idsIfUndelivered: [undeliveredId],
      })

      await sleep(100)

      const undelivered = await db.i_users.findUndelivered(undeliveredId)
      assert(assertion || typeof undelivered?.value === typeof data)
    })
  })
})