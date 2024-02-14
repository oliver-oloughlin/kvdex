import { assert } from "jsr:@std/assert@0.215/assert"
import { generateLargeUsers } from "../utils.ts"
import { useDb } from "../utils.ts"

Deno.test("serialized_collection - getMany", async (t) => {
  await t.step("Should get all documents", async () => {
    await useDb(async (db) => {
      const users = generateLargeUsers(1_000)
      const cr = await db.s_users.addMany(users)
      assert(cr.ok)

      const { result } = await db.s_users.getMany()
      assert(result.length === users.length)
      assert(
        users.every((user) =>
          result.some((doc) => doc.value.username === user.username)
        ),
      )
    })
  })
})
