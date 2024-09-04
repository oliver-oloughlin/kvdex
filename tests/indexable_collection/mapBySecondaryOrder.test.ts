import { assert } from "../test.deps.ts"
import {
  mockUser1,
  mockUser2,
  mockUser3,
  mockUsersWithAlteredAge,
} from "../mocks.ts"
import { useDb } from "../utils.ts"

Deno.test("indexable_collection - mapBySecondaryOrder", async (t) => {
  await t.step(
    "Should run callback mapper function for each document in the collection by secondary order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge)
        assert(cr.ok)

        const { result } = await db.i_users.mapBySecondaryOrder(
          "age",
          (doc) => doc.value.username,
        )

        assert(result[0] === mockUser3.username)
        assert(result[1] === mockUser1.username)
        assert(result[2] === mockUser2.username)
      })
    },
  )
})
