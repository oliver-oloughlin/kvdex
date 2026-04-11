import { mockUser1 } from "../../tests/mocks.ts";
import { useDb } from "../../tests/utils.ts";

Deno.bench("serialized_indexable_collection - set", async (b) => {
  await useDb(async (db) => {
    b.start();
    await db.is_users.set("id", mockUser1);
    b.end();
  });
});
