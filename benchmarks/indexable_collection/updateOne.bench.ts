import { mockUser1 } from "../../tests/mocks.ts";
import { generateUsers, useDb } from "../../tests/utils.ts";

Deno.bench("indexable_collection - updateOne (replace) [1_000]", async (b) => {
  await useDb(async (db) => {
    const users = generateUsers(1_000);
    await db.i_users.addMany(users);

    b.start();
    await db.i_users.updateOne(mockUser1, { strategy: "replace" });
    b.end();
  });
});

Deno.bench(
  "indexable_collection - updateOne (shallow merge) [1_000]",
  async (b) => {
    await useDb(async (db) => {
      const users = generateUsers(1_000);
      await db.i_users.addMany(users);

      b.start();
      await db.i_users.updateOne({ age: 30 }, { strategy: "merge-shallow" });
      b.end();
    });
  },
);

Deno.bench(
  "indexable_collection - updateOne (deep merge) [1_000]",
  async (b) => {
    await useDb(async (db) => {
      const users = generateUsers(1_000);
      await db.i_users.addMany(users);

      b.start();
      await db.i_users.updateOne({ age: 30 }, { strategy: "merge" });
      b.end();
    });
  },
);
