import { mockUser1 } from "../../tests/mocks.ts"
import { useDb } from "../../tests/utils.ts"

Deno.bench("serialized_indexable_collection - find", async (b) => {
  await useDb(async (db) => {
    const id = "id"
    await db.is_users.set(id, mockUser1)

    b.start()
    await db.is_users.find(id)
    b.end()
  })
})
