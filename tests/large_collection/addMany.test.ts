import { assert } from "../deps.ts"
import { generateInvalidUsers, generateLargeUsers, useDb } from "../utils.ts"

Deno.test("large_collection - addMany", async (t) => {
  await t.step(
    "Should successfully add 1000 documents to the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(1_000)
        const crs = await db.l_users.addMany(users)
        assert(crs.every((cr) => cr.ok))

        const docs = await db.l_users.findMany(
          crs.map((cr) => cr.ok ? cr.id : ""),
        )
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
        const crs = await db.zl_users.addMany(users)
        assert(crs.every((cr) => cr.ok))

        const docs = await db.zl_users.findMany(
          crs.map((cr) => cr.ok ? cr.id : ""),
        )
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

        await db.zl_users.addMany(users).catch(() => assertion = true)

        assert(assertion)
      })
    },
  )
})
