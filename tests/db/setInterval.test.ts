import { kvdex } from "../../mod.ts"
import { assert } from "../deps.ts"
import { sleep, useKv } from "../utils.ts"

Deno.test({
  name: "db - setInterval",
  sanitizeOps: false,
  fn: async (t) => {
    await t.step(
      "Should run callback function given amount of times",
      async () => {
        await useKv(async (kv) => {
          const db = kvdex(kv, {})

          let count1 = 0
          let count2 = 0
          let count3 = 0

          db.setInterval(() => count1++, {
            interval: 10,
            exitOn: ({ count }) => count === 2,
          })

          db.setInterval(() => count2++, {
            interval: () => Math.random() * 20,
            exitOn: ({ previousTimestamp }) => previousTimestamp === null,
          })

          db.setInterval(() => count3++, {
            interval: 10,
            exitOn: ({ previousInterval }) => previousInterval > 0,
          })

          await sleep(1_000)

          assert(count1 === 2)
          assert(count2 === 0)
          assert(count3 === 1)
        })
      },
    )
  },
})
