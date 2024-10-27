import { mockUser1 } from "../../tests/mocks.ts";
import { useDb } from "../../tests/utils.ts";

Deno.bench("serialized_collection - delete [1]", async (b) => {
  await useDb(async (db) => {
    const id = crypto.randomUUID();
    await db.s_users.set(id, mockUser1);

    b.start();
    await db.s_users.delete(id);
    b.end();
  });
});
