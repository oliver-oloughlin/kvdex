import { assert } from "../deps.ts"
import { mockUserInvalid } from "../mocks.ts"
import { generateLargeUsers, useDb } from "../utils.ts"

const [user] = generateLargeUsers(1)

Deno.test("serialized_indexable_collection - updateMany", async (t) => {
  await t.step(
    "Should partially update 1000 documents using shallow merge",
    async () => {
      await useDb(async (db) => {
        const users = generateLargeUsers(1_000)
        const cr = await db.is_users.addMany(users)
        assert(cr.ok)

        const { result: docs } = await db.is_users.getMany()
        const ids = docs.map((doc) => doc.id)
        const versionstamps = docs.map((doc) => doc.versionstamp)

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const { result } = await db.is_users.updateMany(updateData, {
          mergeType: "shallow",
        })

        assert(
          result.every((cr) =>
            cr.ok && ids.includes(cr.id) &&
            !versionstamps.includes(cr.versionstamp)
          ),
        )

        await db.is_users.forEach((doc) => {
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
        const users = generateLargeUsers(1_000)
        const cr = await db.is_users.addMany(users)
        assert(cr.ok)

        const { result: docs } = await db.is_users.getMany()
        const ids = docs.map((doc) => doc.id)
        const versionstamps = docs.map((doc) => doc.versionstamp)

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const { result } = await db.is_users.updateMany(updateData, {
          mergeType: "deep",
        })

        assert(
          result.every((cr) =>
            cr.ok && ids.includes(cr.id) &&
            !versionstamps.includes(cr.versionstamp)
          ),
        )

        await db.is_users.forEach((doc) => {
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
      const users = generateLargeUsers(10)
      let assertion = true

      const cr = await db.zis_users.addMany(users)
      assert(cr.ok)

      await db.zis_users.updateMany(user).catch(() => assertion = false)

      assert(assertion)
    })
  })

  await t.step("Should fail to parse and update document", async () => {
    await useDb(async (db) => {
      const users = generateLargeUsers(10)
      let assertion = false

      const cr = await db.zis_users.addMany(users)
      assert(cr.ok)

      await db.zis_users.updateMany(mockUserInvalid).catch(() =>
        assertion = true
      )

      assert(assertion)
    })
  })
})
