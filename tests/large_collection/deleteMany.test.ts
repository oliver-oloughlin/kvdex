import { assert } from "../deps.ts"
import { generateLargeUsers, useDb } from "../utils.ts"

Deno.test("large_collection - deleteMany", async (t) => {
  await t.step("Should delete all documents from the collection", async () => {
    await useDb(async (db) => {
      const users = generateLargeUsers(1_000)
      const cr = await db.l_users.addMany(users)
      assert(cr.ok)

      const count1 = await db.l_users.count()
      assert(count1 === users.length)

      await db.l_users.deleteMany()

      const count2 = await db.l_users.count()
      assert(count2 === 0)
    })
  })
})
