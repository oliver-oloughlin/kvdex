import { assert, assertEquals } from "../test.deps.ts"
import { mockUser2, mockUsersWithAlteredAge } from "../mocks.ts"
import { useDb } from "../utils.ts"

Deno.test("indexable_collection - deleteBySecondaryOrder", async (t) => {
  await t.step(
    "Should delete documents and indices from the collection by secondary order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge)
        const count1 = await db.i_users.count()
        assert(cr.ok)
        assertEquals(count1, mockUsersWithAlteredAge.length)

        await db.i_users.deleteBySecondaryOrder("age", {
          limit: mockUsersWithAlteredAge.length - 1,
        })

        const count2 = await db.i_users.count()
        const doc = await db.i_users.getOne()

        assertEquals(count2, 1)
        assertEquals(doc?.value.username, mockUser2.username)
        assertEquals(doc?.value.address, mockUser2.address)
      })
    },
  )
})
