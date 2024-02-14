import { assert } from "jsr:@std/assert@0.215/assert"
import { mockUser1 } from "../mocks.ts"
import { useDb } from "../utils.ts"

Deno.test("indexable_collection - deleteByPrimaryIndex", async (t) => {
  await t.step(
    "Should successfully delete a document and its indices from the collection by primary index",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.add(mockUser1)
        const count1 = await db.i_users.count()
        const byPrimary1 = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        )
        const bySecondary1 = await db.i_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        )

        assert(cr.ok)
        assert(count1 === 1)
        assert(byPrimary1?.id === cr.id)
        assert(bySecondary1.result.at(0)?.id === cr.id)

        await db.i_users.deleteByPrimaryIndex("username", mockUser1.username)

        const count2 = await db.i_users.count()
        const doc = await db.i_users.find(cr.id)
        const byPrimary2 = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        )
        const bySecondary2 = await db.i_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        )

        assert(count2 === 0)
        assert(doc === null)
        assert(byPrimary2 === null)
        assert(bySecondary2.result.length === 0)
      })
    },
  )
})
