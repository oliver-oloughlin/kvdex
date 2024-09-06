import { assert, assertEquals } from "../test.deps.ts"
import { mockUser2, mockUsersWithAlteredAge } from "../mocks.ts"
import { useDb } from "../utils.ts"

Deno.test("serialized_indexable_collection - deleteBySecondaryOrder", async (t) => {
  await t.step(
    "Should delete documents and indices from the collection by secondary order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.addMany(mockUsersWithAlteredAge)
        const count1 = await db.is_users.count()
        assert(cr.ok)
        assertEquals(count1, mockUsersWithAlteredAge.length)

        await db.is_users.deleteBySecondaryOrder("age", {
          limit: mockUsersWithAlteredAge.length - 1,
        })

        const count2 = await db.is_users.count()
        const doc = await db.is_users.getOne()

        assertEquals(count2, 1)
        assertEquals(doc?.value.username, mockUser2.username)
        assertEquals(doc?.value.address, mockUser2.address)
      })
    },
  )
})
