import { assert } from "../deps.ts"
import { sleep, useDb } from "../utils.ts"

Deno.test("db - cron", async (t) => {
  await t.step("Should perform cron jobs given amount of times", async () => {
    await useDb(async (db) => {
      let count1 = 0
      let count2 = 0
      let count3 = 0

      const l1 = db.cron(() => count1++, {
        interval: 10,
        exitOn: ({ count }) => count === 2,
      })

      const l2 = db.cron(() => count2++, {
        interval: 10,
        exitOn: ({ isFirstJob }) => isFirstJob,
      })

      const l3 = db.cron(() => count3++, {
        interval: 10,
        exitOn: ({ previousInterval }) => previousInterval > 0,
      })

      await sleep(1_000)

      assert(count1 === 2)
      assert(count2 === 0)
      assert(count3 === 1)

      return async () => await Promise.all([l1, l2, l3])
    })
  })
})
