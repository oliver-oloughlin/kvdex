import { assert } from "../deps.ts"
import { mockUser1 } from "../mocks.ts"
import { generateUsers, useDb } from "../utils.ts"

Deno.test("indexable_collection - addMany", async (t) => {
  await t.step(
    "Should successfully add 1000 documents to the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const crs = await db.i_users.addMany(users)
        assert(crs.every((cr) => cr.ok))

        const docs = await db.i_users.findMany(
          crs.map((cr) => cr.ok ? cr.id : ""),
        )
        assert(docs.length === users.length)
        assert(
          users.every((user) =>
            docs.some((doc) => doc.value.username === user.username)
          ),
        )
      })
    },
  )

  await t.step(
    "Should not add documents with colliding primary indices",
    async () => {
      await useDb(async (db) => {
        const crs = await db.i_users.addMany([mockUser1, mockUser1])
        const count = await db.i_users.count()

        assert(crs.length === 2)
        assert(crs.some((cr) => cr.ok))
        assert(crs.some((cr) => !cr.ok))
        assert(count === 1)
      })
    },
  )
})
