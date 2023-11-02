import { assert } from "../deps.ts"
import { generateUsers, useDb } from "../utils.ts"

Deno.test("db - deleteAll", async (t) => {
  await t.step(
    "Should delete all documents from the database",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(100)
        const u64s = [
          new Deno.KvU64(10n),
          new Deno.KvU64(20n),
        ]

        const crs1 = await db.i_users.addMany(users)
        const crs2 = await db.l_users.addMany(users)

        const crs3 = await db.u64s.addMany(u64s)

        assert(crs1.every((cr) => cr.ok))
        assert(crs2.every((cr) => cr.ok))
        assert(crs3.every((cr) => cr.ok))

        const count1 = await db.countAll()
        assert(count1 === users.length * 2 + u64s.length)

        await db.deleteAll()

        const count2 = await db.countAll()
        assert(count2 === 0)
      })
    },
  )
})
