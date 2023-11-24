import { generateUsers, useDb } from "../../tests/utils.ts"

Deno.bench("serialized_collection - getMany", async (b) => {
  await useDb(async (db) => {
    const users = generateUsers(1_000)
    await db.users.addMany(users)

    b.start()
    await db.s_users.count()
    b.end()
  })
})
