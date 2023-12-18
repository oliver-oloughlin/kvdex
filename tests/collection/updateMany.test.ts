import { collection, kvdex, model } from "../../mod.ts"
import { assert } from "../deps.ts"
import { mockUser1, mockUserInvalid } from "../mocks.ts"
import { generateNumbers, generateUsers, useDb, useKv } from "../utils.ts"

Deno.test("collection - updateMany", async (t) => {
  await t.step(
    "Should partially update 1000 documents of model type using shallow merge",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const cr = await db.users.addMany(users)
        assert(cr.ok)

        const docs = await db.users.getMany()
        const ids = docs.result.map((doc) => doc.id)
        const versionstamps = docs.result.map((doc) => doc.versionstamp)

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const { result } = await db.users.updateMany(updateData, {
          strategy: "merge-shallow",
        })

        assert(
          result.every((cr) =>
            cr.ok && ids.includes(cr.id) &&
            !versionstamps.includes(cr.versionstamp)
          ),
        )

        await db.users.forEach((doc) => {
          assert(doc.value.address.country === updateData.address.country)
          assert(doc.value.address.city === updateData.address.city)
          assert(doc.value.address.houseNr === updateData.address.houseNr)
          assert(typeof doc.value.address.street === "undefined")
        })
      })
    },
  )

  await t.step(
    "Should partially update 1000 documents of model type using deep merge",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const cr = await db.users.addMany(users)
        assert(cr.ok)

        const docs = await db.users.getMany()
        const ids = docs.result.map((doc) => doc.id)
        const versionstamps = docs.result.map((doc) => doc.versionstamp)

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const { result } = await db.users.updateMany(updateData, {
          strategy: "merge-deep",
        })

        assert(
          result.every((cr) =>
            cr.ok && ids.includes(cr.id) &&
            !versionstamps.includes(cr.versionstamp)
          ),
        )

        await db.users.forEach((doc) => {
          assert(doc.value.address.country === updateData.address.country)
          assert(doc.value.address.city === updateData.address.city)
          assert(doc.value.address.houseNr === updateData.address.houseNr)
          assert(doc.value.address.street !== undefined)
        })
      })
    },
  )

  await t.step(
    "Should update 1000 documents of types primitive, array and built-in object by overwriting value",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          numbers: collection(model<number>()),
          arrays: collection(model<string[]>()),
          dates: collection(model<Date>()),
        })

        const numbers = generateNumbers(1_000)

        const arrays: string[][] = []
        for (let i = 0; i < 1_000; i++) {
          arrays.push(["1", "2", "3"])
        }

        const dates: Date[] = []
        for (let i = 0; i < 1_000; i++) {
          dates.push(new Date("2000-01-01"))
        }

        const cr1 = await db.numbers.addMany(numbers)
        const cr2 = await db.arrays.addMany(arrays)
        const cr3 = await db.dates.addMany(dates)

        assert(cr1.ok)
        assert(cr2.ok)
        assert(cr3.ok)

        const docs1 = await db.numbers.getMany()
        const docs2 = await db.arrays.getMany()
        const docs3 = await db.dates.getMany()

        const ids1 = docs1.result.map((doc) => doc.id)
        const ids2 = docs2.result.map((doc) => doc.id)
        const ids3 = docs3.result.map((doc) => doc.id)

        const versionstamps1 = docs1.result.map((doc) => doc.versionstamp)
        const versionstamps2 = docs2.result.map((doc) => doc.versionstamp)
        const versionstamps3 = docs3.result.map((doc) => doc.versionstamp)

        const val1 = 20
        const val2 = ["4"]
        const val3 = new Date("2016-01-01")

        const updateQuery1 = await db.numbers.updateMany(val1)
        const updateQuery2 = await db.arrays.updateMany(val2)
        const updateQuery3 = await db.dates.updateMany(val3)

        assert(updateQuery1.result.every((cr) => cr.ok))
        assert(updateQuery2.result.every((cr) => cr.ok))
        assert(updateQuery3.result.every((cr) => cr.ok))

        await db.numbers.forEach((doc) => {
          assert(doc.value === val1)
          assert(ids1.includes(doc.id))
          assert(!versionstamps1.includes(doc.versionstamp))
        })

        await db.arrays.forEach((doc) => {
          assert(JSON.stringify(doc.value) === JSON.stringify(val2))
          assert(ids2.includes(doc.id))
          assert(!versionstamps2.includes(doc.versionstamp))
        })

        await db.dates.forEach((doc) => {
          assert(doc.value.valueOf() === val3.valueOf())
          assert(ids3.includes(doc.id))
          assert(!versionstamps3.includes(doc.versionstamp))
        })
      })
    },
  )

  await t.step("Should successfully parse and update", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10)
      let assertion = true

      const cr = await db.z_users.addMany(users)
      assert(cr.ok)

      await db.z_users.updateMany(mockUser1).catch(() => assertion = false)

      assert(assertion)
    })
  })

  await t.step("Should fail to parse and update document", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10)
      let assertion = false

      const cr = await db.z_users.addMany(users)
      assert(cr.ok)

      await db.z_users.updateMany(mockUserInvalid).catch(() => assertion = true)

      assert(assertion)
    })
  })
})
