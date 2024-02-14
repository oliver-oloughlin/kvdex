import { assert } from "jsr:@std/assert@0.215/assert"
import { generateInvalidUsers, generateUsers, useDb } from "../utils.ts"

Deno.test("collection - addMany", async (t) => {
  await t.step(
    "Should successfully add 1000 documents to the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const cr = await db.users.addMany(users)
        assert(cr.ok)

        const { result } = await db.users.getMany()

        assert(result.length === users.length)
        assert(
          users.every((user) =>
            result.some((doc) => doc.value.username === user.username)
          ),
        )
      })
    },
  )

  await t.step(
    "Should successfully parse and add 1000 documents to the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const cr = await db.z_users.addMany(users)
        assert(cr.ok)

        const { result } = await db.z_users.getMany()
        assert(result.length === users.length)
        assert(
          users.every((user) =>
            result.some((doc) => doc.value.username === user.username)
          ),
        )
      })
    },
  )

  await t.step(
    "Should fail to parse and add 1000 documents to the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateInvalidUsers(1_000)
        let assertion = false

        await db.z_users.addMany(users).catch(() => assertion = true)

        assert(assertion)
      })
    },
  )
})
