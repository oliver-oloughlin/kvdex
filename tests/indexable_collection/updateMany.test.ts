import { assert } from "../deps.ts"
import { mockUser1, mockUserInvalid } from "../mocks.ts"
import { generateUsers, useDb } from "../utils.ts"

Deno.test("indexable_collection - updateMany", async (t) => {
  await t.step(
    "Should partially update 1000 documents using shallow merge",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const cr = await db.i_users.addMany(users)
        assert(cr.ok)

        const { result: docs } = await db.i_users.getMany()
        const ids = docs.map((doc) => doc.id)
        const versionstamps = docs.map((doc) => doc.versionstamp)

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const { result } = await db.i_users.updateMany(updateData, {
          strategy: "merge-shallow",
        })

        assert(
          result.every((cr) =>
            cr.ok && ids.includes(cr.id) &&
            !versionstamps.includes(cr.versionstamp)
          ),
        )

        await db.i_users.forEach((doc) => {
          assert(doc.value.address.country === updateData.address.country)
          assert(doc.value.address.city === updateData.address.city)
          assert(doc.value.address.houseNr === updateData.address.houseNr)
          assert(typeof doc.value.address.street === "undefined")
        })
      })
    },
  )

  await t.step(
    "Should partially update 1000 documents using deep merge",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const cr = await db.i_users.addMany(users)
        assert(cr.ok)

        const { result: docs } = await db.i_users.getMany()
        const ids = docs.map((doc) => doc.id)
        const versionstamps = docs.map((doc) => doc.versionstamp)

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const { result } = await db.i_users.updateMany(updateData, {
          strategy: "merge-deep",
        })

        assert(
          result.every((cr) =>
            cr.ok && ids.includes(cr.id) &&
            !versionstamps.includes(cr.versionstamp)
          ),
        )

        await db.i_users.forEach((doc) => {
          assert(doc.value.address.country === updateData.address.country)
          assert(doc.value.address.city === updateData.address.city)
          assert(doc.value.address.houseNr === updateData.address.houseNr)
          assert(typeof doc.value.address.street !== "undefined")
        })
      })
    },
  )

  await t.step("Should successfully parse and update", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10)
      let assertion = true

      const cr = await db.zi_users.addMany(users)
      assert(cr.ok)

      await db.zi_users.updateMany(mockUser1).catch(() => assertion = false)

      assert(assertion)
    })
  })

  await t.step("Should fail to parse and update document", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10)
      let assertion = false

      const cr = await db.zi_users.addMany(users)
      assert(cr.ok)

      await db.zi_users.updateMany(mockUserInvalid).catch(() =>
        assertion = true
      )

      assert(assertion)
    })
  })
})
