import { assert } from "../deps.ts"
import { generateUsers, useDb } from "../utils.ts"

Deno.test("db - countAll", async (t) => {
  await t.step(
    "Should correctly count all documents in the database",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(10)

        const cr1 = await db.i_users.addMany(users)
        const cr2 = await db.l_users.addMany(users)
        const cr3 = await db.u64s.addMany([
          new Deno.KvU64(0n),
          new Deno.KvU64(0n),
        ])

        assert(cr1.ok)
        assert(cr2.ok)
        assert(cr3.ok)

        const count = await db.countAll()
        assert(count === 22)
      })
    },
  )
})
