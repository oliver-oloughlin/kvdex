import { useDb } from "../../tests/utils.ts";

Deno.bench("db - deleteAll", async (b) => {
  await useDb(async (db) => {
    const u64s: Deno.KvU64[] = [];

    for (let i = 0; i < 1_000; i++) {
      u64s.push(new Deno.KvU64(100n));
    }

    await db.u64s.addMany(u64s);

    b.start();
    await db.deleteAll();
    b.end();
  });
});
