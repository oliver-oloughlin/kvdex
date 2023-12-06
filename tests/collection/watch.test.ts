import { assert } from "../deps.ts"
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts"
import { sleep, useDb } from "../utils.ts"

Deno.test({
  name: "collection - watch",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async (t) => {
    await t.step("Should receive all document updates", async () => {
      await useDb(async (db) => {
        const id = "id"
        let count = 0
        let username = ""
        let lastDoc: any

        db.users.watch(id, (doc) => {
          count++
          lastDoc = doc
          if (doc?.value.username) {
            username = doc.value.username
          }
        })

        await db.users.set(id, mockUser1)
        await sleep(500)
        await db.users.write(id, mockUser2)
        await sleep(500)
        await db.users.update(id, mockUser3)
        await sleep(500)
        await db.users.delete(id)
        await sleep(500)

        assert(count === 4)
        assert(username === mockUser3.username)
        assert(lastDoc === null)
      })
    })

    await t.step("Should not receive unrelated document updates", async () => {
      await useDb(async (db) => {
        const id1 = "id1"
        const id2 = "id2"
        let count = 0
        let username = ""
        let lastDoc: any

        db.users.watch(id1, (doc) => {
          count++
          lastDoc = doc
          if (doc?.value.username) {
            username = doc.value.username
          }
        })

        await db.users.set(id2, mockUser1)
        await sleep(500)
        await db.users.write(id2, mockUser2)
        await sleep(500)
        await db.users.update(id2, mockUser3)
        await sleep(500)
        await db.users.delete(id2)
        await sleep(500)

        // Account for initial invocation
        assert(count === 1)
        assert(username === "")
        assert(lastDoc === null)
      })
    })
  },
})
