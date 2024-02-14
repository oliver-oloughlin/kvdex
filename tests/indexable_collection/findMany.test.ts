import { assert } from "jsr:@std/assert@0.215/assert"
import { generateUsers, useDb } from "../utils.ts"

Deno.test("indexable_collection - findMany", async (t) => {
  await t.step("Should find all documents", async () => {
    await useDb(async (db) => {
      const users = generateUsers(1_000)
      const cr = await db.i_users.addMany(users)
      assert(cr.ok)

      const { result: docs } = await db.i_users.getMany()

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
      const users = generateUsers(10)
      const cr = await db.i_users.addMany(users)
      assert(cr.ok)

      const docs = await db.i_users.findMany(["", "", ""])
      assert(docs.length === 0)
    })
  })
})
