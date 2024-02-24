import { assert } from "../test.deps.ts"
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts"
import { useDb } from "../utils.ts"

Deno.test("serialized_indexable_collection - countBySecondaryIndex", async (t) => {
  await t.step(
    "Should correctly count total number of documents in the collection by secondary index",
    async () => {
      await useDb(async (db) => {
        const count1 = await db.is_users.countBySecondaryIndex(
          "age",
          mockUser1.age,
        )
        assert(count1 === 0)

        const cr = await db.is_users.addMany([mockUser1, mockUser2, mockUser3])
        assert(cr.ok)

        const count2 = await db.is_users.countBySecondaryIndex(
          "age",
          mockUser1.age,
        )

        assert(count2 === 2)
      })
    },
  )
})
