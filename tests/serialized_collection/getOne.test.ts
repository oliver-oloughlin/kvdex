import { assert } from "jsr:@std/assert@0.215/assert"
import { sleep, useDb } from "../utils.ts"
import { mockUser1, mockUser2 } from "../mocks.ts"

Deno.test("serialized_collection - getOne", async (t) => {
  await t.step("Should get only one document", async () => {
    await useDb(async (db) => {
      const cr1 = await db.s_users.add(mockUser1)
      await sleep(10)
      const cr2 = await db.s_users.add(mockUser2)

      assert(cr1.ok)
      assert(cr2.ok)

      const doc = await db.s_users.getOne()
      assert(doc !== null)
      assert(doc.value.username === mockUser1.username)
    })
  })
})
