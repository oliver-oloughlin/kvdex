import { assert } from "../deps.ts"
import { mockUser1, mockUser2 } from "../mocks.ts"
import { useDb } from "../utils.ts"

Deno.test("indexable_collection - findBySecondaryIndex", async (t) => {
  await t.step("Should find documents by secondary index", async () => {
    await useDb(async (db) => {
      const cr1 = await db.i_users.add(mockUser1)
      const cr2 = await db.i_users.add(mockUser2)
      assert(cr1.ok && cr2.ok)

      const bySecondary = await db.i_users.findBySecondaryIndex(
        "age",
        mockUser1.age,
      )

      assert(bySecondary.result.length === 2)
      assert(bySecondary.result.some((doc) => doc.id === cr1.id))
      assert(bySecondary.result.some((doc) => doc.id === cr2.id))
    })
  })

  await t.step(
    "Should not find documents by non-existing secondary index",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.i_users.add(mockUser1)
        const cr2 = await db.i_users.add(mockUser2)
        assert(cr1.ok && cr2.ok)

        const bySecondary = await db.i_users.findBySecondaryIndex(
          "age",
          -1,
        )

        assert(bySecondary.result.length === 0)
      })
    },
  )
})
