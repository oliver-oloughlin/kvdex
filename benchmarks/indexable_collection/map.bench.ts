import { generateUsers, useDb } from "../../tests/utils.ts";

Deno.bench("indexable_collection - map [1_000]", async (b) => {
  await useDb(async (db) => {
    const users = generateUsers(1_000);
    await db.i_users.addMany(users);

    b.start();
    await db.i_users.map((doc) => doc.value.username);
    b.end();
  });
});
