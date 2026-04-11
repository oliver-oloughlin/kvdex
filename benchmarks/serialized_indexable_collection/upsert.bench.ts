import { mockUser1, mockUser2 } from "../../tests/mocks.ts";
import { useDb } from "../../tests/utils.ts";

Deno.bench(
  "serialized_indexable_collection - upsert (insert)",
  async (b) => {
    await useDb(async (db) => {
      b.start();
      await db.is_users.upsert({
        id: "id",
        set: mockUser1,
        update: { age: 30 },
      });
      b.end();
    });
  },
);

Deno.bench(
  "serialized_indexable_collection - upsert (update)",
  async (b) => {
    await useDb(async (db) => {
      await db.is_users.set("id", mockUser1);

      b.start();
      await db.is_users.upsert({
        id: "id",
        set: mockUser2,
        update: { age: 30 },
      });
      b.end();
    });
  },
);
