import { assert } from "jsr:@std/assert@0.215/assert"
import { generateLargeUsers, useDb } from "../utils.ts"

Deno.test("serialized_collection - deleteMany", async (t) => {
  await t.step("Should delete all documents from the collection", async () => {
    await useDb(async (db) => {
      const users = generateLargeUsers(1_000)
      const cr = await db.s_users.addMany(users)
      assert(cr.ok)

      const count1 = await db.s_users.count()
      assert(count1 === users.length)

      await db.s_users.deleteMany()

      const count2 = await db.s_users.count()
      assert(count2 === 0)
    })
  })
})
