import { mockUser1 } from "../../tests/mocks.ts";
import type { User } from "../../tests/models.ts";
import { generateUsers, useDb } from "../../tests/utils.ts";

Deno.bench(
  "serialized_indexable_collection - updateOneBy (replace) [1_000]",
  async (b) => {
    await useDb(async (db) => {
      const targetUsers = generateUsers(1_000, 25);
      const otherUsers = generateUsers(1_000, 50);
      await db.is_users.addMany(targetUsers);
      await db.is_users.addMany(otherUsers);

      b.start();
      await db.is_users.updateOneBy("age", 25, mockUser1, {
        strategy: "replace",
      });
      b.end();
    });
  },
);

Deno.bench(
  "serialized_indexable_collection - updateOneBy (shallow merge) [1_000]",
  async (b) => {
    await useDb(async (db) => {
      const targetUsers = generateUsers(1_000, 25);
      const otherUsers = generateUsers(1_000, 50);
      await db.is_users.addMany(targetUsers);
      await db.is_users.addMany(otherUsers);

      const updateData: Partial<User> = { age: 30 };

      b.start();
      await db.is_users.updateOneBy("age", 25, updateData, {
        strategy: "merge-shallow",
      });
      b.end();
    });
  },
);

Deno.bench(
  "serialized_indexable_collection - updateOneBy (deep merge) [1_000]",
  async (b) => {
    await useDb(async (db) => {
      const targetUsers = generateUsers(1_000, 25);
      const otherUsers = generateUsers(1_000, 50);
      await db.is_users.addMany(targetUsers);
      await db.is_users.addMany(otherUsers);

      const updateData: Partial<User> = { age: 30 };

      b.start();
      await db.is_users.updateOneBy("age", 25, updateData, {
        strategy: "merge",
      });
      b.end();
    });
  },
);
