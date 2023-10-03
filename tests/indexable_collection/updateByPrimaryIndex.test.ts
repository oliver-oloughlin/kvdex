import { Document } from "../../mod.ts"
import { assert } from "../deps.ts"
import { mockUser1 } from "../mocks.ts"
import { User } from "../models.ts"
import { useDb } from "../utils.ts"

Deno.test("indexable_collection - updateByPrimaryIndex", async (t) => {
  await t.step(
    "Should partially update document and indices by primary index, using shallow merge",
    async () => {
      await useDb(async (db) => {
        const cr = await db.i_users.add(mockUser1)
        assert(cr.ok)

        const updateData = {
          address: {
            country: "Ireland",
            city: "Dublin",
            houseNr: null,
          },
        }

        const updateCr = await db.i_users.updateByPrimaryIndex(
          "username",
          mockUser1.username,
          updateData,
        )

        const byId = await db.i_users.find(cr.id)

        const byPrimary = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        )

        const bySecondary = await db.i_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        )

        assert(updateCr.ok)
        assert(updateCr.id === cr.id)
        assert(byPrimary?.id === cr.id)
        assert(bySecondary.result.at(0)?.id === cr.id)
        assert(updateCr.versionstamp !== cr.versionstamp)
        assert(updateCr.versionstamp === byPrimary.versionstamp)
        assert(updateCr.versionstamp === bySecondary.result.at(0)?.versionstamp)

        const asserts = (doc: Document<User> | null) => {
          assert(doc !== null)
          assert(doc.value.username === mockUser1.username)
          assert(doc.value.age === mockUser1.age)
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
})
