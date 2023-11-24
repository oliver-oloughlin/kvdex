import { mockUser1 } from "../../tests/mocks.ts"
import { useDb } from "../../tests/utils.ts"

Deno.bench("collection - find", async (b) => {
  await useDb(async (db) => {
    const id = "id"
    await db.users.set(id, mockUser1)

    b.start()
    await db.users.find(id)
    b.end()
  })
})
