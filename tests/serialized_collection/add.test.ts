import { assert } from "../test.deps.ts"
import { mockUserInvalid } from "../mocks.ts"
import { generateLargeUsers, useDb } from "../utils.ts"

Deno.test("serialized_collection - add", async (t) => {
  await t.step("Should add new document entry to collection", async () => {
    await useDb(async (db) => {
      const [user] = generateLargeUsers(1)

      const cr = await db.s_users.add(user)
      assert(cr.ok)

      const doc = await db.s_users.find(cr.id)
      assert(doc !== null)
      assert(doc.value.username === user.username)
    })
  })

  await t.step(
    "Should successfully parse and add new document entry to collection",
    async () => {
      await useDb(async (db) => {
        const [user] = generateLargeUsers(1)

        const cr = await db.zs_users.add(user)
        assert(cr.ok)

        const doc = await db.zs_users.find(cr.id)
        assert(doc !== null)
        assert(doc.value.username === user.username)
      })
    },
  )

  await t.step(
    "Should fail parse and add new document entry to collection",
    async () => {
      await useDb(async (db) => {
        let assertion = false
        await db.zs_users.add(mockUserInvalid).catch(() => assertion = true)
        assert(assertion)
      })
    },
  )
})
