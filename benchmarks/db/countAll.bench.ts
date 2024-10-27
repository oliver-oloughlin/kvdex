import { generateLargeUsers, generateUsers, useDb } from "../../tests/utils.ts";

Deno.bench("db - deleteAll", async (b) => {
  await useDb(async (db) => {
    const users = generateUsers(1_000);
    const largeUsers = generateLargeUsers(1_000);

    await db.users.addMany(users);
    await db.i_users.addMany(users);
    await db.s_users.addMany(largeUsers);
    await db.is_users.addMany(largeUsers);

    b.start();
    await db.countAll();
    b.end();
  });
});
