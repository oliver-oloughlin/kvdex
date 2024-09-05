import { assert, assertEquals } from "../test.deps.ts"
import {
  mockUser1,
  mockUser2,
  mockUserInvalid,
  mockUsersWithAlteredAge,
} from "../mocks.ts"
import { generateUsers, useDb } from "../utils.ts"
import { User } from "../models.ts"

Deno.test("indexable_collection - updateBySecondaryOrder", async (t) => {
  await t.step(
    "Should update documents of KvObject type using shallow merge by secondary order",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge)
        assert(cr.ok)

        const docs = await db.i_users.getMany()
        const ids = docs.result.map((doc) => doc.id)
        const versionstamps = docs.result.map((doc) => doc.versionstamp)

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const { result } = await db.i_users.updateBySecondaryOrder(
          "age",
          updateData,
          {
            limit: 2,
            strategy: "merge-shallow",
          },
        )

        assert(
          result.every((cr) =>
            cr.ok && ids.includes(cr.id) &&
            !versionstamps.includes(cr.versionstamp)
          ),
        )

        await db.i_users.forEachBySecondaryOrder("age", (doc) => {
          assert(doc.value.address.country === updateData.address.country)
          assert(doc.value.address.city === updateData.address.city)
          assert(doc.value.address.houseNr === updateData.address.houseNr)
          assert(typeof doc.value.address.street === "undefined")
        }, {
          limit: 2,
        })

        const last = await db.i_users.getOneBySecondaryOrder("age", {
          reverse: true,
        })

        assert(last?.value.username === mockUser2.username)
        assert(last.value.address.country === mockUser2.address.country)
      })
    },
  )

  await t.step(
    "Should update documents of KvObject type using deep merge",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge)
        assert(cr.ok)

        const docs = await db.i_users.getMany()
        const ids = docs.result.map((doc) => doc.id)
        const versionstamps = docs.result.map((doc) => doc.versionstamp)

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const { result } = await db.i_users.updateBySecondaryOrder(
          "age",
          updateData,
          {
            limit: 2,
            strategy: "merge",
          },
        )

        assert(
          result.every((cr) =>
            cr.ok && ids.includes(cr.id) &&
            !versionstamps.includes(cr.versionstamp)
          ),
        )

        await db.i_users.forEachBySecondaryOrder("age", (doc) => {
          assert(doc.value.address.country === updateData.address.country)
          assert(doc.value.address.city === updateData.address.city)
          assert(doc.value.address.houseNr === updateData.address.houseNr)
          assert(doc.value.address.street !== undefined)
        }, { limit: 2 })

        const last = await db.i_users.getOneBySecondaryOrder("age", {
          reverse: true,
        })

        assert(last?.value.username === mockUser2.username)
        assert(last.value.address.country === mockUser2.address.country)
      })
    },
  )

  await t.step(
    "Should only update one document of type KvObject using replace (primary index collision)",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.addMany(mockUsersWithAlteredAge)
        assert(cr.ok)

        const docs = await db.i_users.getMany()
        const ids = docs.result.map((doc) => doc.id)
        const versionstamps = docs.result.map((doc) => doc.versionstamp)

        const updateData: User = {
          username: "test",
          age: 10,
          address: {
            country: "Norway",
            city: "Trondheim",
            houseNr: 10,
          },
        }

        const { result: crs } = await db.i_users.updateBySecondaryOrder(
          "age",
          updateData,
          {
            strategy: "replace",
          },
        )

        assert(
          crs.some((cr) =>
            cr.ok && ids.includes(cr.id) &&
            !versionstamps.includes(cr.versionstamp)
          ),
        )

        assert(
          crs.some((cr) => !cr.ok),
        )

        const { result } = await db.i_users.getManyBySecondaryOrder("age")

        assertEquals(result[0].value.username, updateData.username)
        assertEquals(
          result[0].value.address.country,
          updateData.address.country,
        )
        assertEquals(result[0].value.address.city, updateData.address.city)
        assertEquals(
          result[0].value.address.houseNr,
          updateData.address.houseNr,
        )
        assertEquals(result[0].value.address.street, updateData.address.street)

        assertEquals(result[1].value.username, mockUser1.username)
        assertEquals(result[1].value.address.country, mockUser1.address.country)
        assertEquals(result[1].value.address.city, mockUser1.address.city)
        assertEquals(result[1].value.address.houseNr, mockUser1.address.houseNr)
        assertEquals(result[1].value.address.street, mockUser1.address.street)

        assertEquals(result[2].value.username, mockUser2.username)
        assertEquals(result[2].value.address.country, mockUser2.address.country)
        assertEquals(result[2].value.address.city, mockUser2.address.city)
        assertEquals(result[2].value.address.houseNr, mockUser2.address.houseNr)
        assertEquals(result[2].value.address.street, mockUser2.address.street)
      })
    },
  )

  await t.step("Should successfully parse and update", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10)
      let assertion = true

      const cr = await db.zi_users.addMany(users)
      assert(cr.ok)

      await db.zi_users.updateBySecondaryOrder("age", mockUser1)
        .catch(() => assertion = false)

      assert(assertion)
    })
  })

  await t.step("Should fail to parse and update document", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10)
      let assertion = false

      const cr = await db.zi_users.addMany(users)
      assert(cr.ok)

      await db.zi_users.updateBySecondaryOrder(
        "age",
        mockUserInvalid,
      ).catch(() => assertion = true)

      assert(assertion)
    })
  })
})
