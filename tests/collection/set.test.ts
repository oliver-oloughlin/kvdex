import { assert } from "../deps.ts"
import { mockUser1, mockUser2, mockUserInvalid } from "../mocks.ts"
import { useDb } from "../utils.ts"

Deno.test("collection - set", async (t) => {
  await t.step("Should set new document entry in collection", async () => {
    await useDb(async (db) => {
      const cr = await db.users.set("id", mockUser1)
      assert(cr.ok)

      const doc = await db.users.find(cr.id)
      assert(doc !== null)
      assert(doc.value.username === mockUser1.username)
    })
  })

  await t.step(
    "Should not set new document entry in collection with colliding id",
    async () => {
      await useDb(async (db) => {
        const id = "id"

        const cr1 = await db.users.set(id, mockUser1)
        assert(cr1.ok)

        const cr2 = await db.users.set(id, mockUser2)
        assert(!cr2.ok)

        const doc = await db.users.find(id)
        assert(doc !== null)
        assert(doc.value.username === mockUser1.username)
      })
    },
  )

  await t.step(
    "Should overwrite document in collection with colliding id",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.users.set("id", mockUser1)
        assert(cr1.ok)

        const cr2 = await db.users.set("id", mockUser2, { overwrite: true })
        assert(cr2.ok)

        const doc = await db.users.find("id")
        assert(doc !== null)
        assert(doc.value.username === mockUser2.username)
      })
    },
  )

  await t.step("Should successfully parse and set document", async () => {
    await useDb(async (db) => {
      let assertion = true
      await db.z_users.set("id", mockUser1).catch(() => assertion = false)
      assert(assertion)
    })
  })

  await t.step("Should fail to parse and set document", async () => {
    await useDb(async (db) => {
      let assertion = false
      await db.z_users.set("id", mockUserInvalid).catch(() => assertion = true)
      assert(assertion)
    })
  })
})
