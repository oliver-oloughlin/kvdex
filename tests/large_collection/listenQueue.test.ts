import { kvdex, KvValue, largeCollection, QueueMessage } from "../../mod.ts"
import {
  KVDEX_KEY_PREFIX,
  UNDELIVERED_KEY_PREFIX,
} from "../../src/constants.ts"
import { extendKey } from "../../src/utils.ts"
import { assert } from "../deps.ts"
import { User } from "../models.ts"
import { sleep, useKv } from "../utils.ts"

Deno.test("large_collection - listenQueue", async (t) => {
  await t.step("Should receive message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data"
      const undeliveredId = "id"

      const db = kvdex(kv, {
        l_users: largeCollection<User>().build(),
      })

      let assertion = false

      db.l_users.listenQueue((msgData) => {
        assertion = msgData === data
      })

      const msg: QueueMessage<KvValue> = {
        collectionKey: db.l_users._keys.baseKey,
        data,
      }

      await kv.enqueue(msg, {
        keysIfUndelivered: [
          extendKey([KVDEX_KEY_PREFIX], UNDELIVERED_KEY_PREFIX, undeliveredId),
        ],
      })

      await sleep(100)

      const undelivered = await db.l_users.findUndelivered(undeliveredId)
      assert(assertion || typeof undelivered?.value === typeof data)
    })
  })

  await t.step("Should not receive db queue message", async () => {
    await useKv(async (kv) => {
      const db = kvdex(kv, {
        l_users: largeCollection<User>().build(),
      })

      let assertion = true

      db.l_users.listenQueue(() => {
        assertion = false
      })

      await db.enqueue("data")

      await sleep(100)

      assert(assertion)
    })
  })
})
