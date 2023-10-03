import { assert } from "../deps.ts"
import { mockUser1 } from "../mocks.ts"
import { useDb } from "../utils.ts"

Deno.test("indexable_collection - findByPrimaryIndex", async (t) => {
  await t.step("Should find document by primary index", async () => {
    await useDb(async (db) => {
      const id = "id"

      const cr = await db.i_users.set(id, mockUser1)
      assert(cr.ok)

      const doc = await db.i_users.findByPrimaryIndex(
        "username",
        mockUser1.username,
      )
      assert(doc !== null)
      assert(doc.value.username === mockUser1.username)
    })
  })

  await t.step("Should not find document by non-existing index", async () => {
    await useDb(async (db) => {
      const doc = await db.i_users.findByPrimaryIndex(
        "username",
        mockUser1.username,
      )
      assert(doc === null)
    })
  })
})
