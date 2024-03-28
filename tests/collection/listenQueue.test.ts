import {
  collection,
  kvdex,
  type KvValue,
  model,
  type QueueMessage,
} from "../../mod.ts"
import {
  KVDEX_KEY_PREFIX,
  UNDELIVERED_KEY_PREFIX,
} from "../../src/constants.ts"
import { createHandlerId, extendKey } from "../../src/utils.ts"
import { assert } from "../test.deps.ts"
import { createResolver, sleep, useKv } from "../utils.ts"

Deno.test("collection - listenQueue", async (t) => {
  await t.step("Should receive message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data"
      const undeliveredId = "id"
      const sleeper = createResolver()

      const db = kvdex(kv, {
        numbers: collection(model<number>()),
      })

      const handlerId = createHandlerId(db.numbers._keys.base, undefined)

      let assertion = false

      const listener = db.numbers.listenQueue((msgData) => {
        assertion = msgData === data
        sleeper.resolve()
      })

      const msg: QueueMessage<KvValue> = {
        __is_undefined__: false,
        __handlerId__: handlerId,
        __data__: data,
      }

      await kv.enqueue(msg, {
        keysIfUndelivered: [
          extendKey(
            [KVDEX_KEY_PREFIX],
            UNDELIVERED_KEY_PREFIX,
            undeliveredId,
          ),
        ],
      })

      await sleeper.promise

      const undelivered = await db.numbers.findUndelivered(undeliveredId)
      assert(assertion || typeof undelivered?.value === typeof data)

      return async () => await listener
    })
  })

  await t.step("Should not receive db queue message", async () => {
    await useKv(async (kv) => {
      const db = kvdex(kv, {
        numbers: collection(model<number>()),
      })

      let assertion = true

      const listener = db.numbers.listenQueue(() => {
        assertion = false
      })

      await db.enqueue("data")

      await sleep(500)

      assert(assertion)

      return async () => await listener
    })
  })
})
