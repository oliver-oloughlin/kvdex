import { assert } from "../deps.ts"
import { generateUsers, useDb } from "../utils.ts"

Deno.test("db - countAll", async (t) => {
  await t.step(
    "Should correctly count all documents in the database",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(10)

        const crs1 = await db.i_users.addMany(users)
        const crs2 = await db.l_users.addMany(users)
        const crs3 = await db.u64s.addMany([
          new Deno.KvU64(0n),
          new Deno.KvU64(0n),
        ])

        assert(crs1.every((cr) => cr.ok))
        assert(crs2.every((cr) => cr.ok))
        assert(crs3.every((cr) => cr.ok))

        const count = await db.countAll()
        assert(count === 22)
      })
    },
  )
})
