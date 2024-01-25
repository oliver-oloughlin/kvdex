import { mockUser1 } from "../../tests/mocks.ts"
import type { User } from "../../tests/models.ts"
import { useDb } from "../../tests/utils.ts"

Deno.bench(
  "serialized_indexable_collection - update (shallow merge)",
  async (b) => {
    await useDb(async (db) => {
      await db.is_users.add(mockUser1)

      const updateData: Partial<User> = {
        address: {
          country: "USA",
          city: "Los Angeles",
          street: "Sesame Street",
          houseNr: null,
        },
      }

      b.start()

      await db.is_users.updateByPrimaryIndex(
        "username",
        mockUser1.username,
        updateData,
        { strategy: "merge-shallow" },
      )

      b.end()
    })
  },
)

Deno.bench("serialized_collection - update (deep merge)", async (b) => {
  await useDb(async (db) => {
    await db.is_users.add(mockUser1)

    const updateData: Partial<User> = {
      address: {
        country: "USA",
        city: "Los Angeles",
        street: "Sesame Street",
        houseNr: null,
      },
    }

    b.start()

    await db.is_users.updateByPrimaryIndex(
      "username",
      mockUser1.username,
      updateData,
      { strategy: "merge" },
    )

    b.end()
  })
})
