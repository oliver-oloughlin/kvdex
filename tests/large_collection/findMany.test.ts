import { assert } from "../deps.ts"
import { generateLargeUsers, useDb } from "../utils.ts"

Deno.test("large_collection - findMany", async (t) => {
  await t.step("Should find all documents", async () => {
    await useDb(async (db) => {
      const users = generateLargeUsers(1_000)
      const crs = await db.l_users.addMany(users)
      assert(crs.every((cr) => cr.ok))

      const docs = await db.l_users.findMany(
        crs.map((cr) => cr.ok ? cr.id : ""),
      )
      assert(docs.length === users.length)
      assert(
        users.every((user) =>
          docs.some((doc) => doc.value.username === user.username)
        ),
      )
    })
  })

  await t.step("Should not find any documents", async () => {
    await useDb(async (db) => {
      const users = generateLargeUsers(10)
      const crs = await db.l_users.addMany(users)
      assert(crs.every((cr) => cr.ok))

      const docs = await db.l_users.findMany(["", "", ""])
      assert(docs.length === 0)
    })
  })
})
