import { assert } from "../test.deps.ts"
import { generateLargeUsers, useDb } from "../utils.ts"

const [user] = generateLargeUsers(1)

Deno.test("serialized_indexable_collection - find", async (t) => {
  await t.step("Should find document by id", async () => {
    await useDb(async (db) => {
      const id = "id"

      const cr = await db.is_users.set(id, user)
      assert(cr.ok)

      const doc = await db.is_users.find(id)
      assert(doc !== null)
      assert(doc.value.username === user.username)
    })
  })

  await t.step("Should not find document by non-existing id", async () => {
    await useDb(async (db) => {
      const doc = await db.is_users.find("123")
      assert(doc === null)
    })
  })
})
