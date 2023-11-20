import { assert } from "../deps.ts"
import { generateLargeUsers } from "../utils.ts"
import { useDb } from "../utils.ts"

Deno.test("serialized_collection - map", async (t) => {
  await t.step(
    "Should run callback mapper function for each document in the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(1_000)
        const cr = await db.s_users.addMany(users)
        assert(cr.ok)

        const { result } = await db.s_users.map((doc) => doc.value.username)

        assert(result.length === users.length)
        assert(
          users.every((user) =>
            result.some((username) => username === user.username)
          ),
        )
      })
    },
  )
})
