import { collection, CommitResult, kvdex, model } from "../../mod.ts"
import { assert } from "../deps.ts"
import { mockUser1, mockUserInvalid } from "../mocks.ts"
import { User } from "../models.ts"
import { generateNumbers, generateUsers, useDb, useKv } from "../utils.ts"

Deno.test("collection - updateMany", async (t) => {
  await t.step(
    "Should partially update 1000 documents of model type using shallow merge",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const crs = await db.users.addMany(users)
        assert(crs.every((cr) => cr.ok))

        const okCrs = crs.filter((cr) => cr.ok) as CommitResult<User>[]
        const ids = okCrs.map((cr) => cr.id)
        const versionstamps = okCrs.map((cr) => cr.versionstamp)

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const { result } = await db.users.updateMany(updateData)
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

        const crs1 = await db.numbers.addMany(numbers) as CommitResult<number>[]
        const crs2 = await db.arrays.addMany(arrays) as CommitResult<string[]>[]
        const crs3 = await db.dates.addMany(dates) as CommitResult<Date>[]

        assert(crs1.every((cr) => cr.ok))
        assert(crs2.every((cr) => cr.ok))
        assert(crs3.every((cr) => cr.ok))

        const ids1 = crs1.map((cr) => cr.id)
        const versionstamps1 = crs1.map((cr) => cr.versionstamp)
        const ids2 = crs2.map((cr) => cr.id)
        const versionstamps2 = crs2.map((cr) => cr.versionstamp)
        const ids3 = crs3.map((cr) => cr.id)
        const versionstamps3 = crs3.map((cr) => cr.versionstamp)

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

      const crs = await db.z_users.addMany(users)
      assert(crs.every((cr) => cr.ok))

      await db.z_users.updateMany(mockUser1).catch(() => assertion = false)

      assert(assertion)
    })
  })

  await t.step("Should fail to parse and update document", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10)
      let assertion = false

      const crs = await db.z_users.addMany(users)
      assert(crs.every((cr) => cr.ok))

      await db.z_users.updateMany(mockUserInvalid).catch(() => assertion = true)

      assert(assertion)
    })
  })
})
