import { generateUsers, useDb } from "../../tests/utils.ts";

Deno.bench(
  "serialized_indexable_collection - countBySecondaryIndex [1_000]",
  async (b) => {
    await useDb(async (db) => {
      const targetUsers = generateUsers(1_000, 25);
      const otherUsers = generateUsers(1_000, 50);
      await db.is_users.addMany(targetUsers);
      await db.is_users.addMany(otherUsers);

      b.start();
      await db.is_users.countBySecondaryIndex("age", 25);
      b.end();
    });
  },
);
