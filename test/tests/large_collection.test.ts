import { assert } from "https://deno.land/std@0.195.0/assert/assert.ts"
import { db, reset } from "../config.ts"
import { testLargeData } from "../large_data.ts"

Deno.test("large_collection", async (t) => {
  await t.step("set", async (t) => {
    await t.step("Should set document entry with given id", async () => {
      await reset()

      const cr = await db.largeDocs.set("id_1", testLargeData)
      assert(cr.ok)

      const largeDoc = await db.largeDocs.find(cr.id)
      console.log(largeDoc?.value)

      assert(largeDoc !== null)
      assert(largeDoc.value.name === testLargeData.name)
    })
  })
})
