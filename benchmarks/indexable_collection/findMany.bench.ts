import { generateUsers, useDb } from "../../tests/utils.ts"

Deno.bench("indexable_collection - findMany [1_000]", async (b) => {
  await useDb(async (db) => {
    const users = generateUsers(1_000)
    const ids: string[] = []

    for (const user of users) {
      const id = crypto.randomUUID()
      await db.i_users.set(id, user)
      ids.push(id)
    }

    b.start()
    await db.i_users.findMany(ids)
    b.end()
  })
})
