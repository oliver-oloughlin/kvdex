import { collection, kvdex, model } from "../../mod.ts"
import { assert, assertEquals } from "../deps.ts"
import { mockUser1, mockUserInvalid } from "../mocks.ts"
import { generateNumbers, generateUsers, useDb, useKv } from "../utils.ts"

Deno.test("collection - updateMany", async (t) => {
  await t.step(
    "Should update 1000 documents of KvObject type using shallow merge",
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
    "Should update 1000 documents of KvObject type using deep merge",
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
          strategy: "merge",
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
    "Should update 1000 documents of KvObject type using replace",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const cr = await db.users.addMany(users)
        assert(cr.ok)

        const docs = await db.users.getMany()
        const ids = docs.result.map((doc) => doc.id)
        const versionstamps = docs.result.map((doc) => doc.versionstamp)

        const { result } = await db.users.updateMany(mockUser1, {
          strategy: "replace",
        })

        assert(
          result.every((cr) =>
            cr.ok && ids.includes(cr.id) &&
            !versionstamps.includes(cr.versionstamp)
          ),
        )

        await db.users.forEach((doc) => {
          assert(doc.value.address.country === mockUser1.address.country)
          assert(doc.value.address.city === mockUser1.address.city)
          assert(doc.value.address.houseNr === mockUser1.address.houseNr)
          assert(doc.value.address.street === mockUser1.address.street)
        })
      })
    },
  )

  await t.step(
    "Should update 1000 documents of type Array, Set and Map using merge",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          arrays: collection(model<number[]>()),
          sets: collection(model<Set<number>>()),
          maps: collection(model<Map<string, number>>()),
        })

        const val1 = [1, 2, 4]
        const setEntries = [1, 2, 4]
        const val2 = new Set(setEntries)
        const mapEntries = [["1", 1], ["2", 2], ["4", 4]] as const
        const val3 = new Map(mapEntries)

        const vals1: number[][] = []
        const vals2: Set<number>[] = []
        const vals3: Map<string, number>[] = []
        for (let i = 0; i < 1_000; i++) {
          vals1.push(val1)
          vals2.push(val2)
          vals3.push(val3)
        }

        const cr1 = await db.arrays.addMany(vals1)
        const cr2 = await db.sets.addMany(vals2)
        const cr3 = await db.maps.addMany(vals3)

        assert(cr1.ok)
        assert(cr2.ok)
        assert(cr3.ok)

        const u1 = [1, 3, 5]
        const uSetEntries = [1, 3, 5]
        const u2 = new Set(uSetEntries)
        const uMapEntries = [["1", 1], ["3", 3], ["5", 5]] as const
        const u3 = new Map(uMapEntries)

        const { result: updateCrs1 } = await db.arrays.updateMany(u1, {
          strategy: "merge",
        })

        const { result: updateCrs2 } = await db.sets.updateMany(u2, {
          strategy: "merge",
        })

        const { result: updateCrs3 } = await db.maps.updateMany(u3, {
          strategy: "merge",
        })

        assert(updateCrs1.every((cr) => cr.ok))
        assert(updateCrs2.every((cr) => cr.ok))
        assert(updateCrs3.every((cr) => cr.ok))

        const { result: docs1 } = await db.arrays.getMany()
        const { result: docs2 } = await db.sets.getMany()
        const { result: docs3 } = await db.maps.getMany()

        assert(docs1.length === vals1.length)
        assert(docs2.length === vals2.length)
        assert(docs3.length === vals3.length)

        docs1.forEach((doc) => assertEquals(doc.value, [...val1, ...u1]))
        docs2.forEach((doc) =>
          assertEquals(doc.value, new Set([...setEntries, ...uSetEntries]))
        )
        docs3.forEach((doc) =>
          assertEquals(doc.value, new Map([...mapEntries, ...uMapEntries]))
        )
      })
    },
  )

  await t.step(
    "Should update 1000 documents of types primitive and built-in object using replace",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          numbers: collection(model<number>()),
          strings: collection(model<string>()),
          dates: collection(model<Date>()),
        })

        const numbers = generateNumbers(1_000)

        const strings: string[] = []
        for (let i = 0; i < 1_000; i++) {
          strings.push(Math.random().toString())
        }

        const dates: Date[] = []
        for (let i = 0; i < 1_000; i++) {
          dates.push(new Date("2000-01-01"))
        }

        const cr1 = await db.numbers.addMany(numbers)
        const cr2 = await db.strings.addMany(strings)
        const cr3 = await db.dates.addMany(dates)

        assert(cr1.ok)
        assert(cr2.ok)
        assert(cr3.ok)

        const docs1 = await db.numbers.getMany()
        const docs2 = await db.strings.getMany()
        const docs3 = await db.dates.getMany()

        const ids1 = docs1.result.map((doc) => doc.id)
        const ids2 = docs2.result.map((doc) => doc.id)
        const ids3 = docs3.result.map((doc) => doc.id)

        const versionstamps1 = docs1.result.map((doc) => doc.versionstamp)
        const versionstamps2 = docs2.result.map((doc) => doc.versionstamp)
        const versionstamps3 = docs3.result.map((doc) => doc.versionstamp)

        const val1 = 20
        const val2 = "updated"
        const val3 = new Date("2016-01-01")

        const updateQuery1 = await db.numbers.updateMany(val1)
        const updateQuery2 = await db.strings.updateMany(val2)
        const updateQuery3 = await db.dates.updateMany(val3)

        assert(updateQuery1.result.every((cr) => cr.ok))
        assert(updateQuery2.result.every((cr) => cr.ok))
        assert(updateQuery3.result.every((cr) => cr.ok))

        await db.numbers.forEach((doc) => {
          assertEquals(doc.value, val1)
          assert(ids1.includes(doc.id))
          assert(!versionstamps1.includes(doc.versionstamp))
        })

        await db.strings.forEach((doc) => {
          assertEquals(doc.value, val2)
          assert(ids2.includes(doc.id))
          assert(!versionstamps2.includes(doc.versionstamp))
        })

        await db.dates.forEach((doc) => {
          assertEquals(doc.value, val3)
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
