import { collection, kvdex } from "../../mod.ts"
import { assert } from "../deps.ts"
import { mockUser1 } from "../mocks.ts"
import { useDb, useKv } from "../utils.ts"

Deno.test("large_collection - update", async (t) => {
  await t.step(
    "Should partially update document of model type using shallow merge",
    async () => {
      await useDb(async (db) => {
        const cr = await db.l_users.add(mockUser1)
        assert(cr.ok)

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const updateCr = await db.l_users.update(cr.id, updateData)

        assert(updateCr.ok)
        assert(updateCr.id === cr.id)
        assert(updateCr.versionstamp !== cr.versionstamp)

        const doc = await db.l_users.find(cr.id)

        assert(doc !== null)
        assert(doc.value.username === mockUser1.username)
        assert(doc.value.age === mockUser1.age)
        assert(doc.value.address.country === updateData.address.country)
        assert(doc.value.address.city === updateData.address.city)
        assert(doc.value.address.houseNr === updateData.address.houseNr)
        assert(typeof doc.value.address.street === "undefined")
      })
    },
  )

  await t.step(
    "Should update documents of types primitive, array and built-in object by overwriting value",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          numbers: collection<number>().build(),
          arrays: collection<string[]>().build(),
          dates: collection<Date>().build(),
        })

        const cr1 = await db.numbers.add(10)
        const cr2 = await db.arrays.add(["1", "2", "3"])
        const cr3 = await db.dates.add(new Date("2000-01-01"))
        assert(cr1.ok && cr2.ok && cr3.ok)

        const val1 = 20
        const val2 = ["4"]
        const val3 = new Date("2016-01-01")

        const updateCr1 = await db.numbers.update(cr1.id, val1)
        const updateCr2 = await db.arrays.update(cr2.id, val2)
        const updateCr3 = await db.dates.update(cr3.id, val3)
        assert(updateCr1.ok && updateCr2.ok && updateCr3.ok)
        assert(updateCr1.id === cr1.id)
        assert(updateCr1.versionstamp !== cr1.versionstamp)
        assert(updateCr2.id === cr2.id)
        assert(updateCr2.versionstamp !== cr2.versionstamp)
        assert(updateCr3.id === cr3.id)
        assert(updateCr3.versionstamp !== cr3.versionstamp)

        const doc1 = await db.numbers.find(cr1.id)
        const doc2 = await db.arrays.find(cr2.id)
        const doc3 = await db.dates.find(cr3.id)
        assert(doc1 !== null && doc2 !== null && doc3 !== null)

        assert(doc1.value === 20)
        assert(JSON.stringify(doc2.value) === JSON.stringify(val2))
        assert(doc3.value.valueOf() === val3.valueOf())
      })
    },
  )
})
