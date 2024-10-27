import { mockUser1 } from "../../tests/mocks.ts";
import type { User } from "../../tests/models.ts";
import { useDb } from "../../tests/utils.ts";

Deno.bench(
  "serialized_indexable_collection - update (shallow merge)",
  async (b) => {
    await useDb(async (db) => {
      const id = "id";
      await db.is_users.set(id, mockUser1);

      const updateData: Partial<User> = {
        address: {
          country: "USA",
          city: "Los Angeles",
          street: "Sesame Street",
          houseNr: null,
        },
      };

      b.start();
      await db.is_users.update(id, updateData, { strategy: "merge-shallow" });
      b.end();
    });
  },
);

Deno.bench("serialized_collection - update (deep merge)", async (b) => {
  await useDb(async (db) => {
    const id = "id";
    await db.is_users.set(id, mockUser1);

    const updateData: Partial<User> = {
      address: {
        country: "USA",
        city: "Los Angeles",
        street: "Sesame Street",
        houseNr: null,
      },
    };

    b.start();
    await db.is_users.update(id, updateData, { strategy: "merge" });
    b.end();
  });
});
