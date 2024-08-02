import { assert } from "../test.deps.ts"
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts"
import { sleep, useDb } from "../utils.ts"
import type { User } from "../models.ts"
import type { Document } from "../../mod.ts"

Deno.test("indexable_collection - watch", async (t) => {
  await t.step("Should receive all document updates", async () => {
    await useDb(async (db) => {
      const id = "id"
      const docs: (Document<User, string> | null)[] = []

      const { promise, cancel } = db.i_users.watch(id, (doc) => {
        docs.push(doc)
      })

      const cr1 = await db.i_users.set(id, mockUser1)
      await sleep(500)
      const cr2 = await db.i_users.set(id, mockUser2, { overwrite: true })
      await sleep(500)
      const cr3 = await db.i_users.update(id, mockUser3)
      await sleep(500)
      await db.i_users.delete(id)
      await sleep(500)

      assert(cr1.ok)
      assert(cr2.ok)
      assert(cr3.ok)

      assert(docs.some((doc) => doc?.value.username === mockUser1.username))
      assert(docs.some((doc) => doc?.value.username === mockUser2.username))
      assert(docs.some((doc) => doc?.value.username === mockUser3.username))
      assert(docs.some((doc) => doc === null))

      await cancel()
      await promise
    })
  })

  await t.step("Should not receive unrelated document updates", async () => {
    await useDb(async (db) => {
      const id1 = "id1"
      const id2 = "id2"
      let count = 0
      let username = ""
      let lastDoc: any

      const { promise, cancel } = db.i_users.watch(id1, (doc) => {
        count++
        lastDoc = doc
        if (doc?.value.username) {
          username = doc.value.username
        }
      })

      await db.i_users.set(id2, mockUser1)
      await sleep(500)
      await db.i_users.set(id2, mockUser2, { overwrite: true })
      await sleep(500)
      await db.i_users.update(id2, mockUser3)
      await sleep(500)
      await db.i_users.delete(id2)
      await sleep(500)

      // Account for initial invocation
      assert(count === 1)
      assert(username === "")
      assert(lastDoc === null)

      await cancel()
      await promise
    })
  })
})
