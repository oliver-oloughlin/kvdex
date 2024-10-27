import { mockUser1 } from "../../tests/mocks.ts";
import { useDb } from "../../tests/utils.ts";

Deno.bench("serialized_collection - find", async (b) => {
  await useDb(async (db) => {
    const id = "id";
    await db.s_users.set(id, mockUser1);

    b.start();
    await db.s_users.find(id);
    b.end();
  });
});
