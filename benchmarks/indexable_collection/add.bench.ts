import { mockUser1 } from "../../tests/mocks.ts";
import { useDb } from "../../tests/utils.ts";

Deno.bench("indexable_collection - add", async (b) => {
  await useDb(async (db) => {
    b.start();
    await db.i_users.add(mockUser1);
    b.end();
  });
});
