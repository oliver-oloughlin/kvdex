import { mockUser1 } from "../../tests/mocks.ts";
import { useDb } from "../../tests/utils.ts";

Deno.bench("indexable_collection - delete [1]", async (b) => {
  await useDb(async (db) => {
    const id = crypto.randomUUID();
    await db.i_users.set(id, mockUser1);

    b.start();
    await db.i_users.delete(id);
    b.end();
  });
});
