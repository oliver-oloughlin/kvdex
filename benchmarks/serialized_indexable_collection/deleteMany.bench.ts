import { generateUsers, useDb } from "../../tests/utils.ts"

Deno.bench("serialized_indexable_collection - deleteMany", async (b) => {
  await useDb(async (db) => {
    const users = generateUsers(1_000)
    await db.is_users.addMany(users)

    b.start()
    await db.is_users.deleteMany()
    b.end()
  })
})
