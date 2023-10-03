import { assert } from "../deps.ts"
import { generateUsers } from "../utils.ts"
import { useDb } from "../utils.ts"

Deno.test("collection - getMany", async (t) => {
  await t.step("Should get all documents", async () => {
    await useDb(async (db) => {
      const users = generateUsers(1_000)
      const crs = await db.users.addMany(users)
      assert(crs.every((cr) => cr.ok))

      const { result } = await db.users.getMany()
      assert(result.length === users.length)
      assert(
        users.every((user) =>
          result.some((doc) => doc.value.username === user.username)
        ),
      )
    })
  })
})
