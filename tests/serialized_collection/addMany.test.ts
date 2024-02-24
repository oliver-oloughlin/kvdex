import { assert } from "../test.deps.ts"
import { generateInvalidUsers, generateLargeUsers, useDb } from "../utils.ts"

Deno.test("serialized_collection - addMany", async (t) => {
  await t.step(
    "Should successfully add 1000 documents to the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(1_000)
        const cr = await db.s_users.addMany(users)
        assert(cr.ok)

        const { result: docs } = await db.s_users.getMany()

        assert(docs.length === users.length)
        assert(
          users.every((user) =>
            docs.some((doc) => doc.value.username === user.username)
          ),
        )
      })
    },
  )

  await t.step(
    "Should successfully parse and add 1000 documents to the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(1_000)
        const cr = await db.zs_users.addMany(users)
        assert(cr.ok)

        const { result: docs } = await db.zs_users.getMany()

        assert(docs.length === users.length)
        assert(
          users.every((user) =>
            docs.some((doc) => doc.value.username === user.username)
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

        await db.zs_users.addMany(users).catch(() => assertion = true)

        assert(assertion)
      })
    },
  )
})
