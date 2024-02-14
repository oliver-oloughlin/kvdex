import { assert } from "jsr:@std/assert@0.215/assert"
import { generateUsers } from "../utils.ts"
import { useDb } from "../utils.ts"

Deno.test("collection - map", async (t) => {
  await t.step(
    "Should run callback mapper function for each document in the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const cr = await db.users.addMany(users)
        assert(cr.ok)

        const { result } = await db.users.map((doc) => doc.value.username)

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
