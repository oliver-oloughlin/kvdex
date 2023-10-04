import { kvdex } from "../../mod.ts"
import { assert } from "../deps.ts"
import { sleep } from "../utils.ts"

Deno.test("db - cron", async (t) => {
  await t.step("Should perform cron jobs given amount of times", async () => {
    const kv = await Deno.openKv(":memory:")
    const db = kvdex(kv, {})

    let count1 = 0
    let count2 = 0

    db.cron(() => count1++, { exitOn: ({ count }) => count === 2 })

    db.cron(() => count2++, { exitOn: ({ count }) => count === 5 })

    await sleep(1_000)

    console.log(count1, count2)

    assert(count1 === 3)
    assert(count2 === 6)

    kv.close()
  })
})
