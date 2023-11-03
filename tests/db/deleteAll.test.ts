import { assert } from "../deps.ts"
import { generateLargeUsers, generateUsers, useDb } from "../utils.ts"

Deno.test("db - deleteAll", async (t) => {
  await t.step(
    "Should delete all documents from the database",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(100)
        const largeUsers = generateLargeUsers(100)
        const u64s = [
          new Deno.KvU64(10n),
          new Deno.KvU64(20n),
        ]

        const cr1 = await db.i_users.addMany(users)
        const cr2 = await db.l_users.addMany(largeUsers)
        const cr3 = await db.u64s.addMany(u64s)

        assert(cr1.ok)
        assert(cr2.ok)
        assert(cr3.ok)

        const count1 = await db.countAll()
        assert(count1 === users.length + largeUsers.length + u64s.length)

        await db.deleteAll()

        const count2 = await db.countAll()
        assert(count2 === 0)
      })
    },
  )
})
