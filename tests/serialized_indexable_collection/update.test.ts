import { Document } from "../../mod.ts"
import { assert } from "../deps.ts"
import { mockUserInvalid } from "../mocks.ts"
import { User } from "../models.ts"
import { generateLargeUsers, useDb } from "../utils.ts"

const [user1, user2] = generateLargeUsers(2)

Deno.test("serialized_indexable_collection - update", async (t) => {
  await t.step(
    "Should partially update document and indices using shallow merge",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.add(user1)
        assert(cr.ok)

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const updateCr = await db.is_users.update(cr.id, updateData, {
          strategy: "merge-shallow",
        })

        const byId = await db.is_users.find(cr.id)

        const byPrimary = await db.is_users.findByPrimaryIndex(
          "username",
          user1.username,
        )

        const bySecondary = await db.is_users.findBySecondaryIndex(
          "age",
          user1.age,
        )

        assert(updateCr.ok)
        assert(updateCr.id === cr.id)
        assert(byPrimary?.id === cr.id)
        assert(bySecondary.result.at(0)?.id === cr.id)
        assert(updateCr.versionstamp !== cr.versionstamp)

        const asserts = (doc: Document<User> | null) => {
          assert(doc !== null)
          assert(doc.value.username === user1.username)
          assert(doc.value.age === user1.age)
          assert(doc.value.address.country === updateData.address.country)
          assert(doc.value.address.city === updateData.address.city)
          assert(doc.value.address.houseNr === updateData.address.houseNr)
          assert(typeof doc.value.address.street === "undefined")
        }

        asserts(byId)
        asserts(byPrimary)
        asserts(bySecondary.result.at(0) ?? null)
      })
    },
  )

  await t.step(
    "Should partially update document and indices using deep merge",
    async () => {
      await useDb(async (db) => {
        const cr = await db.is_users.add(user1)
        assert(cr.ok)

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const updateCr = await db.is_users.update(cr.id, updateData, {
          strategy: "merge-deep",
        })

        const byId = await db.is_users.find(cr.id)

        const byPrimary = await db.is_users.findByPrimaryIndex(
          "username",
          user1.username,
        )

        const bySecondary = await db.is_users.findBySecondaryIndex(
          "age",
          user1.age,
        )

        assert(updateCr.ok)
        assert(updateCr.id === cr.id)
        assert(byPrimary?.id === cr.id)
        assert(bySecondary.result.at(0)?.id === cr.id)
        assert(updateCr.versionstamp !== cr.versionstamp)

        const asserts = (doc: Document<User> | null) => {
          assert(doc !== null)
          assert(doc.value.username === user1.username)
          assert(doc.value.age === user1.age)
          assert(doc.value.address.country === updateData.address.country)
          assert(doc.value.address.city === updateData.address.city)
          assert(doc.value.address.houseNr === updateData.address.houseNr)
          assert(doc.value.address.street !== undefined)
        }

        asserts(byId)
        asserts(byPrimary)
        asserts(bySecondary.result.at(0) ?? null)
      })
    },
  )

  await t.step("Should successfully parse and update document", async () => {
    await useDb(async (db) => {
      let assertion = true

      const cr = await db.zis_users.add(user1)
      assert(cr.ok)

      await db.zis_users.update(cr.id, user2).catch(() => assertion = false)

      assert(assertion)
    })
  })

  await t.step("Should fail to parse and update document", async () => {
    await useDb(async (db) => {
      let assertion = false

      const cr = await db.zis_users.add(user1)
      assert(cr.ok)

      await db.zis_users.update(cr.id, mockUserInvalid).catch(() =>
        assertion = true
      )

      assert(assertion)
    })
  })
})
