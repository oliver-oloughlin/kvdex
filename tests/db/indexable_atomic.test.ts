import { assert } from "../test.deps.ts"
import { mockUser1 } from "../mocks.ts"
import { useDb } from "../utils.ts"

Deno.test("db - indexable_atomic", async (t) => {
  await t.step(
    "Should add document to collection with index entries",
    async () => {
      await useDb(async (db) => {
        await db
          .atomic((schema) => schema.i_users)
          .add(mockUser1)
          .commit()

        const count = await db.i_users.count()

        const byPrimary = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        )

        const bySecondary = await db.i_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        )

        assert(count === 1)
        assert(byPrimary?.value.username === mockUser1.username)
        assert(bySecondary.result.at(0)?.value.username === mockUser1.username)
      })
    },
  )

  await t.step(
    "Should set document in collection with index entries",
    async () => {
      await useDb(async (db) => {
        const id = "id"

        await db
          .atomic((schema) => schema.i_users)
          .set(id, mockUser1)
          .commit()

        const byId = await db.i_users.find(id)

        const byPrimary = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        )

        const bySecondary = await db.i_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        )

        assert(byId?.id === id)
        assert(byPrimary?.id === id)
        assert(bySecondary.result.at(0)?.id === id)
      })
    },
  )

  await t.step(
    "Should not set document in collection with colliding primary index",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.i_users.add(mockUser1)
        assert(cr1.ok)

        const cr2 = await db
          .atomic((schema) => schema.i_users)
          .add(mockUser1)
          .commit()

        assert(!cr2.ok)
      })
    },
  )

  await t.step(
    "Should delete document and indices from collection",
    async () => {
      await useDb(async (db) => {
        const cr1 = await db.i_users.add(mockUser1)
        assert(cr1.ok)

        await db
          .atomic((schema) => schema.i_users)
          .delete(cr1.id)
          .commit()

        const byId = await db.i_users.find(cr1.id)

        const byPrimary = await db.i_users.findByPrimaryIndex(
          "username",
          mockUser1.username,
        )

        const bySecondary = await db.i_users.findBySecondaryIndex(
          "age",
          mockUser1.age,
        )

        assert(byId === null)
        assert(byPrimary === null)
        assert(bySecondary.result.length === 0)
      })
    },
  )

  await t.step(
    "Should fail operation when trying to set and delete from the same indexbale collection",
    async () => {
      await useDb(async (db) => {
        const cr = await db
          .atomic((schema) => schema.i_users)
          .add(mockUser1)
          .delete("id")
          .commit()

        assert(!cr.ok)
      })
    },
  )
})
