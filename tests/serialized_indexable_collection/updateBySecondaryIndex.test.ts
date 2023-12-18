import { assert } from "../deps.ts"
import { mockUserInvalid } from "../mocks.ts"
import { generateLargeUsers, useDb } from "../utils.ts"

const [user1, user2] = generateLargeUsers(2)

Deno.test("serialized_indexable_collection - updateBySecondaryIndex", async (t) => {
  await t.step(
    "Should partially update 1000 documents by secondary index, using shallow merge",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.is_users.add(user1)
        const cr2 = await db.is_users.add(user2)
        assert(cr1.ok && cr2.ok)

        const ids = [cr1.id, cr2.id]
        const versionstamps = [cr1.versionstamp, cr2.versionstamp]

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const { result } = await db.is_users.updateBySecondaryIndex(
          "age",
          user1.age,
          updateData,
          { strategy: "merge-shallow" },
        )

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
    "Should partially update 1000 documents by secondary index, using deep merge",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.is_users.add(user1)
        const cr2 = await db.is_users.add(user2)
        assert(cr1.ok && cr2.ok)

        const ids = [cr1.id, cr2.id]
        const versionstamps = [cr1.versionstamp, cr2.versionstamp]

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const { result } = await db.is_users.updateBySecondaryIndex(
          "age",
          user1.age,
          updateData,
          { strategy: "merge-deep" },
        )

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
      let assertion = true

      const cr = await db.zis_users.addMany([user1, user2])
      assert(cr.ok)

      await db.zis_users.updateBySecondaryIndex("age", user1.age, user1)
        .catch(() => assertion = false)

      assert(assertion)
    })
  })

  await t.step("Should fail to parse and update document", async () => {
    await useDb(async (db) => {
      let assertion = false

      const cr = await db.zis_users.addMany([user1, user2])
      assert(cr.ok)

      await db.zis_users.updateBySecondaryIndex(
        "age",
        user1.age,
        mockUserInvalid,
      ).catch(() => assertion = true)

      assert(assertion)
    })
  })
})
