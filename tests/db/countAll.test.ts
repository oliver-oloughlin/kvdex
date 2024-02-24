import { assert } from "../test.deps.ts"
import { generateLargeUsers, generateUsers, useDb } from "../utils.ts"

Deno.test("db - countAll", async (t) => {
  await t.step(
    "Should correctly count all documents in the database",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(10)
        const largeUsers = generateLargeUsers(10)
        const u64s = [
          new Deno.KvU64(0n),
          new Deno.KvU64(0n),
        ]

        const cr1 = await db.i_users.addMany(users)
        const cr2 = await db.s_users.addMany(largeUsers)
        const cr3 = await db.u64s.addMany(u64s)

        assert(cr1.ok)
        assert(cr2.ok)
        assert(cr3.ok)

        const count = await db.countAll()
        assert(count === users.length + largeUsers.length + u64s.length)
      })
    },
  )
})
