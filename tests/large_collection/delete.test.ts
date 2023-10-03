import { assert } from "../deps.ts"
import { mockUser1 } from "../mocks.ts"
import { generateLargeUsers, useDb } from "../utils.ts"

Deno.test("large_collection - delete", async (t) => {
  await t.step(
    "Should successfully delete a document from the collection",
    async () => {
      await useDb(async (db) => {
        const cr = await db.l_users.add(mockUser1)
        const count1 = await db.l_users.count()

        assert(cr.ok)
        assert(count1 === 1)

        await db.l_users.delete(cr.id)

        const count2 = await db.l_users.count()
        const doc = await db.l_users.find(cr.id)

        assert(count2 === 0)
        assert(doc === null)
      })
    },
  )

  await t.step(
    "Should successfully delete 1000 documents from the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(1_000)
        const crs = await db.l_users.addMany(users)
        const count1 = await db.l_users.count()

        assert(crs.every((cr) => cr.ok))
        assert(count1 === users.length)

        await db.l_users.delete(...crs.map((cr) => cr.ok ? cr.id : ""))

        const count2 = await db.l_users.count()
        assert(count2 === 0)
      })
    },
  )
})
