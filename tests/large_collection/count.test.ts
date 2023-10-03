import { assert } from "../deps.ts"
import { generateLargeUsers } from "../utils.ts"
import { useDb } from "../utils.ts"

Deno.test("large_collection - count", async (t) => {
  await t.step(
    "Should correctly count total number of documents in the collection",
    async () => {
      await useDb(async (db) => {
        const count1 = await db.l_users.count()
        assert(count1 === 0)

        const users = generateLargeUsers(1_000)
        const crs = await db.l_users.addMany(users)
        assert(crs.every((cr) => cr.ok))

        const count2 = await db.l_users.count()
        assert(count2 === users.length)
      })
    },
  )
})
