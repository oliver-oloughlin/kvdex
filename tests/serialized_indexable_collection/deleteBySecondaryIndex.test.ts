import { assert } from "../deps.ts"
import { generateLargeUsers, useDb } from "../utils.ts"

const [user1, user2] = generateLargeUsers(2)

Deno.test("serialized_indexable_collection - deleteBySecondaryIndex", async (t) => {
  await t.step(
    "Should delete documents and indices from the collection by secondary index",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.is_users.add(user1)
        const cr2 = await db.is_users.add(user2)
        assert(cr1.ok && cr2.ok)
        const count1 = await db.is_users.count()

        const byPrimary1 = await db.is_users.findByPrimaryIndex(
          "username",
          user1.username,
        )
        const bySecondary1 = await db.is_users.findBySecondaryIndex(
          "age",
          user1.age,
        )

        assert(count1 === 2)
        assert(byPrimary1?.value.username === user1.username)
        assert(bySecondary1.result.length === 2)

        await db.is_users.deleteBySecondaryIndex("age", user1.age)

        const count2 = await db.is_users.count()

        const byPrimary2 = await db.is_users.findByPrimaryIndex(
          "username",
          user1.username,
        )

        const bySecondary2 = await db.is_users.findBySecondaryIndex(
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
