import { assert } from "jsr:@std/assert@0.215/assert"
import { generateLargeUsers, useDb } from "../utils.ts"

Deno.test("serialized_indexable_collection - findMany", async (t) => {
  await t.step("Should find all documents", async () => {
    await useDb(async (db) => {
      const users = generateLargeUsers(1_000)
      const cr = await db.is_users.addMany(users)
      assert(cr.ok)

      const { result: docs } = await db.is_users.getMany()

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
      const cr = await db.is_users.addMany(users)
      assert(cr.ok)

      const docs = await db.is_users.findMany(["", "", ""])
      assert(docs.length === 0)
    })
  })
})
