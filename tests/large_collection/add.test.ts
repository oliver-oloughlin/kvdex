import { assert } from "../deps.ts"
import { mockUser1 } from "../mocks.ts"
import { useDb } from "../utils.ts"

Deno.test("large_collection - add", async (t) => {
  await t.step("Should add new document entry to collection", async () => {
    await useDb(async (db) => {
      const cr = await db.l_users.add(mockUser1)
      assert(cr.ok)

      const doc = await db.l_users.find(cr.id)
      assert(doc !== null)
      assert(doc.value.username === mockUser1.username)
    })
  })
})
