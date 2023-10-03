import { assert } from "../deps.ts"
import { mockUser1, mockUser2 } from "../mocks.ts"
import { useDb } from "../utils.ts"

Deno.test("indexable_collection - deleteBySecondaryIndex", async (t) => {
  await t.step(
    "Should delete documents and indices from the collection by secondary index",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.i_users.add(mockUser1)
        const cr2 = await db.i_users.add(mockUser2)
        assert(cr1.ok && cr2.ok)
        const count1 = await db.i_users.count()

        const byPrimary1 = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        )
        const bySecondary1 = await db.i_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        )

        assert(count1 === 2)
        assert(byPrimary1?.value.username === mockUser1.username)
        assert(bySecondary1.result.length === 2)

        await db.i_users.deleteBySecondaryIndex("age", mockUser1.age)

        const count2 = await db.i_users.count()

        const byPrimary2 = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        )

        const bySecondary2 = await db.i_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        )

        assert(count2 === 0)
        assert(byPrimary2 === null)
        assert(bySecondary2.result.length === 0)
      })
    },
  )
})
