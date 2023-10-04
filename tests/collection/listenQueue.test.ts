import { collection, kvdex, QueueMessage, QueueValue } from "../../mod.ts"
import {
  KVDEX_KEY_PREFIX,
  UNDELIVERED_KEY_PREFIX,
} from "../../src/constants.ts"
import { createHandlerId, extendKey } from "../../src/utils.ts"
import { assert } from "../deps.ts"
import { sleep, useKv } from "../utils.ts"

Deno.test("collection - listenQueue", async (t) => {
  await t.step("Should receive message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data"
      const undeliveredId = "id"

      const db = kvdex(kv, {
        numbers: collection<number>().build(),
      })

      const handlerId = createHandlerId(db.numbers._keys.baseKey, undefined)

      let assertion = false

      db.numbers.listenQueue((msgData) => {
        assertion = msgData === data
      })

      const msg: QueueMessage<QueueValue> = {
        __handlerId__: handlerId,
        __data__: data,
      }

      await kv.enqueue(msg, {
        keysIfUndelivered: [
          extendKey([KVDEX_KEY_PREFIX], UNDELIVERED_KEY_PREFIX, undeliveredId),
        ],
      })

      await sleep(100)

      const undelivered = await db.numbers.findUndelivered(undeliveredId)
      assert(assertion || typeof undelivered?.value === typeof data)
    })
  })

  await t.step("Should not receive db queue message", async () => {
    await useKv(async (kv) => {
      const db = kvdex(kv, {
        numbers: collection<number>().build(),
      })

      let assertion = true

      db.numbers.listenQueue(() => {
        assertion = false
      })

      await db.enqueue("data")

      await sleep(100)

      assert(assertion)
    })
  })
})
