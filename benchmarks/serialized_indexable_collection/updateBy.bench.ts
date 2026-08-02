import { mockUser1, mockUser2 } from "../../tests/mocks.ts";
import type { User } from "../../tests/models.ts";
import { useDb } from "../../tests/utils.ts";

Deno.bench(
  "serialized_indexable_collection - updateBy (replace)",
  async (b) => {
    await useDb(async (db) => {
      await db.is_users.add(mockUser1);

      b.start();

      await db.is_users.updateBy(
        "username",
        mockUser1.username,
        mockUser2,
        { strategy: "replace" },
      );

      b.end();
    });
  },
);

Deno.bench(
  "serialized_indexable_collection - updateBy (shallow merge)",
  async (b) => {
    await useDb(async (db) => {
      await db.is_users.add(mockUser1);

      const updateData: Partial<User> = {
        address: {
          country: "USA",
          city: "Los Angeles",
          street: "Sesame Street",
          houseNr: null,
        },
      };

      b.start();

      await db.is_users.updateBy(
        "username",
        mockUser1.username,
        updateData,
        { strategy: "merge-shallow" },
      );

      b.end();
    });
  },
);

Deno.bench(
  "serialized_indexable_collection - updateBy (deep merge)",
  async (b) => {
    await useDb(async (db) => {
      await db.is_users.add(mockUser1);

      const updateData: Partial<User> = {
        address: {
          country: "USA",
          city: "Los Angeles",
          street: "Sesame Street",
          houseNr: null,
        },
      };

      b.start();

      await db.is_users.updateBy(
        "username",
        mockUser1.username,
        updateData,
        { strategy: "merge" },
      );

      b.end();
    });
  },
);
