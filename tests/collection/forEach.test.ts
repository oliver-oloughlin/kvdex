import { Document } from "../../mod.ts"
import { assert } from "jsr:@std/assert@0.215/assert"
import { User } from "../models.ts"
import { generateUsers } from "../utils.ts"
import { useDb } from "../utils.ts"

Deno.test("collection - forEach", async (t) => {
  await t.step(
    "Should run callback function for each document in the collection",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const cr = await db.users.addMany(users)
        assert(cr.ok)

        const docs: Document<User>[] = []
        await db.users.forEach((doc) => docs.push(doc))

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
