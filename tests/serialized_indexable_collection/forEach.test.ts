import type { Document } from "../../mod.ts"
import { assert } from "../test.deps.ts"
import type { User } from "../models.ts"
import { generateLargeUsers, useDb } from "../utils.ts"

Deno.test("serialized_indexable_collection - forEach", async (t) => {
  await t.step(
    "Should run callback function for each document in the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(1_000)
        const cr = await db.is_users.addMany(users)
        assert(cr.ok)

        const docs: Document<User, string>[] = []
        await db.is_users.forEach((doc) => docs.push(doc))

        assert(docs.length === users.length)
        assert(
          users.every((user) =>
            docs.some((doc) => doc.value.username === user.username)
          ),
        )
      })
    },
  )
})
