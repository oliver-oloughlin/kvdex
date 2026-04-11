import { generateUsers, useDb } from "../../tests/utils.ts";

Deno.bench("serialized_collection - addMany [1_000]", async (b) => {
  await useDb(async (db) => {
    const users = generateUsers(1_000);

    b.start();
    await db.s_users.addMany(users);
    b.end();
  });
});
