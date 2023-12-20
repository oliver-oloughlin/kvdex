import { collection, kvdex, KvValue, model, QueueMessage } from "../../mod.ts"
import {
  KVDEX_KEY_PREFIX,
  UNDELIVERED_KEY_PREFIX,
} from "../../src/constants.ts"
import { createHandlerId, extendKey } from "../../src/utils.ts"
import { assert } from "../deps.ts"
import { User } from "../models.ts"
import { createResolver, sleep, useKv } from "../utils.ts"

Deno.test("serialized_collection - listenQueue", async (t) => {
  await t.step("Should receive message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data"
      const undeliveredId = "id"

      const db = kvdex(kv, {
        s_users: collection(model<User>()),
      })

      const sleeper = createResolver()
      let assertion = false

      const listener = db.s_users.listenQueue((msgData) => {
        assertion = msgData === data
        sleeper.resolve()
      })

      const handlerId = createHandlerId(db.s_users._keys.base, undefined)

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

      const undelivered = await db.s_users.findUndelivered(undeliveredId)
      assert(assertion || typeof undelivered?.value === typeof data)

      return async () => await listener
    })
  })

  await t.step("Should not receive db queue message", async () => {
    await useKv(async (kv) => {
      const db = kvdex(kv, {
        l_users: collection(model<User>()),
      })

      let assertion = true

      const listener = db.l_users.listenQueue(() => {
        assertion = false
      })

      await db.enqueue("data")

      await sleep(500)

      assert(assertion)

      return async () => await listener
    })
  })
})
