import { Document } from "../../mod.ts"
import { assert } from "../deps.ts"
import { User } from "../models.ts"
import { generateLargeUsers } from "../utils.ts"
import { useDb } from "../utils.ts"

Deno.test("large_collection - forEach", async (t) => {
  await t.step(
    "Should run callback function for each document in the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(1_000)
        const cr = await db.l_users.addMany(users)
        assert(cr.ok)

        const docs: Document<User>[] = []
        await db.l_users.forEach((doc) => docs.push(doc))

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
