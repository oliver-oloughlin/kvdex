import { collection, kvdex, KvValue, model, QueueMessage } from "../../mod.ts"
import {
  KVDEX_KEY_PREFIX,
  UNDELIVERED_KEY_PREFIX,
} from "../../src/constants.ts"
import { createHandlerId, extendKey } from "../../src/utils.ts"
import { assert } from "jsr:@std/assert@0.215/assert"
import { User } from "../models.ts"
import { createResolver, sleep, useKv } from "../utils.ts"

Deno.test("indexable_collection - listenQueue", async (t) => {
  await t.step("Should receive message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data"
      const undeliveredId = "id"

      const db = kvdex(kv, {
        i_users: collection(model<User>(), { indices: {} }),
      })

      const sleeper = createResolver()
      const handlerId = createHandlerId(db.i_users._keys.base, undefined)
      let assertion = false

      const listener = db.i_users.listenQueue((msgData) => {
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

      const undelivered = await db.i_users.findUndelivered(undeliveredId)
      assert(assertion || typeof undelivered?.value === typeof data)

      return async () => await listener
    })
  })

  await t.step("Should not receive db queue message", async () => {
    await useKv(async (kv) => {
      const db = kvdex(kv, {
        i_users: collection(model<User>(), { indices: {} }),
      })

      let assertion = true

      const listener = db.i_users.listenQueue(() => {
        assertion = false
      })

      await db.enqueue("data")

      await sleep(500)

      assert(assertion)

      return async () => await listener
    })
  })
})
