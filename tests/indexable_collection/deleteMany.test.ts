import { assert } from "../deps.ts"
import { generateUsers, useDb } from "../utils.ts"

Deno.test("indexable_collection - deleteMany", async (t) => {
  await t.step(
    "Should delete all documents and indices from the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const user1 = users[0]

        const crs = await db.i_users.addMany(users)
        const count1 = await db.i_users.count()
        const byPrimary1 = await db.i_users.findByPrimaryIndex(
          "username",
          user1.username,
        )
        const bySecondary1 = await db.i_users.findBySecondaryIndex(
          "age",
          user1.age,
        )

        assert(crs.every((cr) => cr.ok))
        assert(count1 === users.length)
        assert(byPrimary1?.value.username === user1.username)
        assert(bySecondary1.result.length > 0)

        await db.i_users.deleteMany()

        const count2 = await db.i_users.count()
        const byPrimary2 = await db.i_users.findByPrimaryIndex(
          "username",
          user1.username,
        )
        const bySecondary2 = await db.i_users.findBySecondaryIndex(
          "age",
          user1.age,
        )

        assert(count2 === 0)
        assert(byPrimary2 === null)
        assert(bySecondary2.result.length === 0)
      })
    },
  )
})
