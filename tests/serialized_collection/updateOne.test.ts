import { collection, kvdex, model } from "../../mod.ts"
import { assert, assertEquals, assertNotEquals } from "../test.deps.ts"
import { mockUser1, mockUser2, mockUser3, mockUserInvalid } from "../mocks.ts"
import {
  generateNumbers,
  generateUsers,
  sleep,
  useDb,
  useKv,
} from "../utils.ts"

Deno.test("serialized_collection - updateOne", async (t) => {
  await t.step(
    "Should update only one document of KvObject type using shallow merge",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.s_users.add(mockUser1)
        await sleep(10)
        const cr2 = await db.s_users.add(mockUser2)

        assert(cr1.ok)
        assert(cr2.ok)

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const updateCr = await db.s_users.updateOne(updateData, {
          strategy: "merge-shallow",
        })

        assert(updateCr.ok)

        const doc1 = await db.s_users.find(cr1.id)
        const doc2 = await db.s_users.find(cr2.id)

        assert(doc1)
        assert(doc2)

        assert(doc1.value.address.country === updateData.address.country)
        assert(doc1.value.address.city === updateData.address.city)
        assert(doc1.value.address.houseNr === updateData.address.houseNr)
        assert(doc1.value.address.street === undefined)

        assert(doc2.value.address.country === mockUser2.address.country)
        assert(doc2.value.address.city === mockUser2.address.city)
        assert(doc2.value.address.houseNr === mockUser2.address.houseNr)
        assert(doc2.value.address.street === mockUser2.address.street)
      })
    },
  )

  await t.step(
    "Should update only one document of KvObject type using deep merge",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.s_users.add(mockUser1)
        await sleep(10)
        const cr2 = await db.s_users.add(mockUser2)

        assert(cr1.ok)
        assert(cr2.ok)

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const updateCr = await db.s_users.updateOne(updateData, {
          strategy: "merge",
        })

        assert(updateCr.ok)

        const doc1 = await db.s_users.find(cr1.id)
        const doc2 = await db.s_users.find(cr2.id)

        assert(doc1)
        assert(doc2)

        assert(doc1.value.address.country === updateData.address.country)
        assert(doc1.value.address.city === updateData.address.city)
        assert(doc1.value.address.houseNr === updateData.address.houseNr)
        assert(doc1.value.address.street === mockUser1.address.street)

        assert(doc2.value.address.country === mockUser2.address.country)
        assert(doc2.value.address.city === mockUser2.address.city)
        assert(doc2.value.address.houseNr === mockUser2.address.houseNr)
        assert(doc2.value.address.street === mockUser2.address.street)
      })
    },
  )

  await t.step(
    "Should update only one document of KvObject type using replace",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.s_users.add(mockUser1)
        await sleep(10)
        const cr2 = await db.s_users.add(mockUser2)

        assert(cr1.ok)
        assert(cr2.ok)

        const updateData = mockUser3

        const updateCr = await db.s_users.updateOne(updateData, {
          strategy: "replace",
        })

        assert(updateCr.ok)

        const doc1 = await db.s_users.find(cr1.id)
        const doc2 = await db.s_users.find(cr2.id)

        assert(doc1)
        assert(doc2)

        assert(doc1.value.username === updateData.username)
        assert(doc1.value.age === updateData.age)
        assert(doc1.value.address.country === updateData.address.country)
        assert(doc1.value.address.city === updateData.address.city)
        assert(doc1.value.address.houseNr === updateData.address.houseNr)
        assert(doc1.value.address.street === undefined)

        assert(doc2.value.username === mockUser2.username)
        assert(doc2.value.age === mockUser2.age)
        assert(doc2.value.address.country === mockUser2.address.country)
        assert(doc2.value.address.city === mockUser2.address.city)
        assert(doc2.value.address.houseNr === mockUser2.address.houseNr)
        assert(doc2.value.address.street === mockUser2.address.street)
      })
    },
  )

  await t.step(
    "Should update only one document of type Array, Set and Map using merge",
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

        const updateCr1 = await db.arrays.updateOne(u1, {
          strategy: "merge",
        })

        const updateCr2 = await db.sets.updateOne(u2, {
          strategy: "merge",
        })

        const updateCr3 = await db.maps.updateOne(u3, {
          strategy: "merge",
        })

        assert(updateCr1.ok)
        assert(updateCr2.ok)
        assert(updateCr3.ok)

        const { result: [d1, ...docs1] } = await db.arrays.getMany()
        const { result: [d2, ...docs2] } = await db.sets.getMany()
        const { result: [d3, ...docs3] } = await db.maps.getMany()

        assertEquals(d1.value, [...val1, ...u1])
        assertEquals(d2.value, new Set([...setEntries, ...uSetEntries]))
        assertEquals(d3.value, new Map([...mapEntries, ...uMapEntries]))

        docs1.forEach((doc) => assertNotEquals(doc.value, [...val1, ...u1]))
        docs2.forEach((doc) =>
          assertNotEquals(doc.value, new Set([...setEntries, ...uSetEntries]))
        )
        docs3.forEach((doc) =>
          assertNotEquals(doc.value, new Map([...mapEntries, ...uMapEntries]))
        )
      })
    },
  )

  await t.step(
    "Should update only one document of types primitive and built-in object using replace",
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

        const val1 = -100
        const val2 = "updated"
        const val3 = new Date("2016-01-01")

        const updateCr1 = await db.numbers.updateOne(val1)
        const updateCr2 = await db.strings.updateOne(val2)
        const updateCr3 = await db.dates.updateOne(val3)

        assert(updateCr1.ok)
        assert(updateCr2.ok)
        assert(updateCr3.ok)

        const { result: [d1, ...ds1] } = await db.numbers.getMany()
        const { result: [d2, ...ds2] } = await db.strings.getMany()
        const { result: [d3, ...ds3] } = await db.dates.getMany()

        assertEquals(d1.value, val1)
        ds1.forEach((doc) => assertNotEquals(doc.value, val1))

        assertEquals(d2.value, val2)
        ds2.forEach((doc) => assertNotEquals(doc.value, val2))

        assertEquals(d3.value, val3)
        ds3.forEach((doc) => assertNotEquals(doc.value, val3))
      })
    },
  )

  await t.step("Should successfully parse and update", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10)
      let assertion = true

      const cr = await db.zs_users.addMany(users)
      assert(cr.ok)

      await db.zs_users.updateOne(mockUser1).catch(() => assertion = false)

      assert(assertion)
    })
  })

  await t.step("Should fail to parse and update document", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10)
      let assertion = false

      const cr = await db.zs_users.addMany(users)
      assert(cr.ok)

      await db.zs_users.updateOne(mockUserInvalid).catch(() => assertion = true)

      assert(assertion)
    })
  })
})
