import { assert } from "jsr:@std/assert@0.215/assert"
import { mockUser1, mockUserInvalid } from "../mocks.ts"
import { generateUsers, useDb } from "../utils.ts"

Deno.test("indexable_collection - updateMany", async (t) => {
  await t.step(
    "Should update 1000 documents of KvObject type using shallow merge",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const cr = await db.i_users.addMany(users)
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
    "Should update 1000 documents of KvObject type using deep merge",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const cr = await db.i_users.addMany(users)
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

        const { result } = await db.i_users.updateMany(updateData, {
          strategy: "merge",
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
          assert(doc.value.address.street !== undefined)
        })
      })
    },
  )

  await t.step(
    "Should only update one document of type KvObject using replace (primary index collision)",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(1_000)
        const cr = await db.i_users.addMany(users)
        assert(cr.ok)

        const docs = await db.i_users.getMany()
        const ids = docs.result.map((doc) => doc.id)
        const versionstamps = docs.result.map((doc) => doc.versionstamp)

        const { result } = await db.i_users.updateMany(mockUser1, {
          strategy: "replace",
        })

        assert(
          result.some((cr) =>
            cr.ok && ids.includes(cr.id) &&
            !versionstamps.includes(cr.versionstamp)
          ),
        )

        assert(
          result.some((cr) => !cr.ok),
        )

        const byPrimary = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        )

        const { result: [bySecondary] } = await db.i_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        )

        assert(byPrimary !== null)
        assert(byPrimary.value.username === mockUser1.username)
        assert(byPrimary.value.address.country === mockUser1.address.country)
        assert(byPrimary.value.address.city === mockUser1.address.city)
        assert(byPrimary.value.address.houseNr === mockUser1.address.houseNr)
        assert(byPrimary.value.address.street === mockUser1.address.street)

        assert(bySecondary !== null)
        assert(bySecondary.value.username === mockUser1.username)
        assert(bySecondary.value.address.country === mockUser1.address.country)
        assert(bySecondary.value.address.city === mockUser1.address.city)
        assert(bySecondary.value.address.houseNr === mockUser1.address.houseNr)
        assert(bySecondary.value.address.street === mockUser1.address.street)
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
