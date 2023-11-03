import { assert } from "../deps.ts"
import { sleep, useDb } from "../utils.ts"

Deno.test("db - setInterval", async (t) => {
  await t.step(
    "Should run callback function given amount of times",
    async () => {
      await useDb(async (db) => {
        let count1 = 0
        let count2 = 0
        let count3 = 0

        const l1 = db.setInterval(() => count1++, {
          interval: 10,
          exitOn: ({ count }) => count === 2,
        })

        const l2 = db.setInterval(() => count2++, {
          interval: () => Math.random() * 20,
          exitOn: ({ previousTimestamp }) => previousTimestamp === null,
        })

        const l3 = db.setInterval(() => count3++, {
          interval: 10,
          exitOn: ({ previousInterval }) => previousInterval > 0,
        })

        await sleep(1_000)

        assert(count1 === 2)
        assert(count2 === 0)
        assert(count3 === 1)

        return async () => await Promise.all([l1, l2, l3])
      })
    },
  )
})
