import { generateUsers, useDb } from "../../tests/utils.ts";

Deno.bench("collection - deleteMany - [1_000]", async (b) => {
  await useDb(async (db) => {
    const users = generateUsers(1_000);
    await db.users.addMany(users);

    b.start();
    await db.users.deleteMany();
    b.end();
  });
});
