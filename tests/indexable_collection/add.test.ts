import { assert } from "../deps.ts"
import { mockUser1 } from "../mocks.ts"
import { useDb } from "../utils.ts"

Deno.test("indexable_collection - add", async (t) => {
  await t.step("Should add new document entry to collection", async () => {
    await useDb(async (db) => {
      const cr = await db.i_users.add(mockUser1)
      assert(cr.ok)

      const doc = await db.i_users.find(cr.id)
      assert(doc !== null)
      assert(doc.value.username === mockUser1.username)
    })
  })

  await t.step(
    "Should not add new document with colliding primary index",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.i_users.add(mockUser1)
        const cr2 = await db.i_users.add(mockUser1)
        const count = await db.i_users.count()
        assert(cr1.ok)
        assert(!cr2.ok)
        assert(count === 1)
      })
    },
  )
})
