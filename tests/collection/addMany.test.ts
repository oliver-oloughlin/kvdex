import { assert } from "../deps.ts"
import { generateUsers, useDb } from "../utils.ts"

Deno.test("collection - addMany", async (t) => {
  await t.step(
    "Should successfully add 1000 documents to the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const crs = await db.users.addMany(users)
        assert(crs.every((cr) => cr.ok))

        const docs = await db.users.findMany(
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
})
