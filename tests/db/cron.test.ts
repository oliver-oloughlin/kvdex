import { kvdex } from "../../mod.ts"
import { assert } from "../deps.ts"
import { sleep } from "../utils.ts"

Deno.test("db - cron", async (t) => {
  await t.step("Should perform cron jobs given amount of times", async () => {
    const kv = await Deno.openKv(":memory:")
    const db = kvdex(kv, {})

    let count1 = 0
    let count2 = 0
    let count3 = 0

    db.cron(() => count1++, {
      interval: 10,
      exitOn: ({ count }) => count === 2,
    })

    db.cron(() => count2++, {
      interval: 10,
      exitOn: ({ isFirstJob }) => isFirstJob,
    })

    db.cron(() => count3++, {
      interval: 10,
      exitOn: ({ previousInterval }) => previousInterval > 0,
    })

    await sleep(1_000)

    assert(count1 === 2)
    assert(count2 === 0)
    assert(count3 === 1)

    kv.close()
  })
})
