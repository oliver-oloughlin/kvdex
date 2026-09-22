import { mockUser1 } from "../../tests/mocks.ts";
import { useDb } from "../../tests/utils.ts";

Deno.bench(
  "serialized_indexable_collection - deleteBy",
  async (b) => {
    await useDb(async (db) => {
      await db.is_users.add(mockUser1);

      b.start();
      await db.is_users.deleteBy("username", mockUser1.username);
      b.end();
    });
  },
);
