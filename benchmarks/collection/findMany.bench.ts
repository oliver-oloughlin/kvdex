import { generateUsers, useDb } from "../../tests/utils.ts"

Deno.bench("collection - findMany [1_000]", async (b) => {
  await useDb(async (db) => {
    const users = generateUsers(1_000)
    const ids: string[] = []

    for (const user of users) {
      const id = crypto.randomUUID()
      await db.users.set(id, user)
      ids.push(id)
    }

    b.start()
    await db.users.findMany(ids)
    b.end()
  })
})
