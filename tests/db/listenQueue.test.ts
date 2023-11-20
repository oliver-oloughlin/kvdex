import {
  collection,
  kvdex,
  model,
  QueueMessage,
  QueueValue,
} from "../../mod.ts"
import { KVDEX_KEY_PREFIX } from "../../src/constants.ts"
import { createHandlerId } from "../../src/utils.ts"
import { assert } from "../deps.ts"
import { sleep, useKv } from "../utils.ts"

Deno.test("db - listenQueue", async (t) => {
  await t.step("Should receive message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data"
      const db = kvdex(kv, {})

      const handlerId = createHandlerId([KVDEX_KEY_PREFIX], undefined)

      let assertion = false

      const listener = db.listenQueue((msgData) => {
        assertion = msgData === data
      })

      await kv.enqueue({
        __handlerId__: handlerId,
        __data__: data,
      } as QueueMessage<QueueValue>)

      await sleep(200)
      assert(assertion)

      return async () => await listener
    })
  })

  await t.step("Should not receive collection queue message", async () => {
    await useKv(async (kv) => {
      const data = "data"

      const db = kvdex(kv, {
        numbers: collection(model<number>()),
      })

      let assertion = true

      const listener = db.listenQueue(() => {
        assertion = false
      })

      await db.numbers.enqueue(data)

      await sleep(100)

      assert(assertion)

      return async () => await listener
    })
  })
})
