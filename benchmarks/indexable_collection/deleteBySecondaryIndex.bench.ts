import { generateUsers, useDb } from "../../tests/utils.ts";

Deno.bench(
  "indexable_collection - deleteBySecondaryIndex [1_000]",
  async (b) => {
    await useDb(async (db) => {
      const targetUsers = generateUsers(1_000, 25);
      const otherUsers = generateUsers(1_000, 50);
      await db.i_users.addMany(targetUsers);
      await db.i_users.addMany(otherUsers);

      b.start();
      await db.i_users.deleteBySecondaryIndex("age", 25);
      b.end();
    });
  },
);
