import { assert } from "../deps.ts"
import { generateUsers } from "../utils.ts"
import { useDb } from "../utils.ts"

Deno.test("collection - count", async (t) => {
  await t.step(
    "Should correctly count total number of documents in the collection",
    async () => {
      await useDb(async (db) => {
        const count1 = await db.users.count()
        assert(count1 === 0)

        const users = generateUsers(1_000)
        const crs = await db.users.addMany(users)
        assert(crs.every((cr) => cr.ok))

        const count2 = await db.users.count()
        assert(count2 === users.length)
      })
    },
  )
})
