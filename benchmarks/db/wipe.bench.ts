import { generateUsers, useDb } from "../../tests/utils.ts";

Deno.bench("db - wipe [4_000]", async (b) => {
  await useDb(async (db) => {
    const users = generateUsers(1_000);

    await db.users.addMany(users);
    await db.i_users.addMany(users);
    await db.s_users.addMany(users);
    await db.is_users.addMany(users);

    b.start();
    await db.wipe();
    b.end();
  });
});
