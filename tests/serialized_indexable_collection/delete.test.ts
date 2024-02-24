import { assert } from "../test.deps.ts"
import { generateLargeUsers, useDb } from "../utils.ts"

const [user] = generateLargeUsers(1)

Deno.test("serialized_indexable_collection - delete", async (t) => {
  await t.step(
    "Should successfully delete a document and its indices from the collection",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.add(user)
        const count1 = await db.is_users.count()
        const byPrimary1 = await db.is_users.findByPrimaryIndex(
          "username",
          user.username,
        )
        const bySecondary1 = await db.is_users.findBySecondaryIndex(
          "age",
          user.age,
        )

        assert(cr.ok)
        assert(count1 === 1)
        assert(byPrimary1?.id === cr.id)
        assert(bySecondary1.result.at(0)?.id === cr.id)

        await db.is_users.delete(cr.id)

        const count2 = await db.is_users.count()
        const doc = await db.is_users.find(cr.id)
        const byPrimary2 = await db.is_users.findByPrimaryIndex(
          "username",
          user.username,
        )
        const bySecondary2 = await db.is_users.findBySecondaryIndex(
          "age",
          user.age,
        )

        assert(count2 === 0)
        assert(doc === null)
        assert(byPrimary2 === null)
        assert(bySecondary2.result.length === 0)
      })
    },
  )

  await t.step(
    "Should successfully delete 1000 documents from the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(1_000)
        const cr = await db.is_users.addMany(users)
        const count1 = await db.is_users.count()

        assert(cr.ok)
        assert(count1 === users.length)

        const { result: ids } = await db.is_users.map((doc) => doc.id)

        await db.is_users.delete(...ids)

        const count2 = await db.is_users.count()
        assert(count2 === 0)
      })
    },
  )
})
