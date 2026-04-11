import { mockUser1 } from "../../tests/mocks.ts";
import { useDb } from "../../tests/utils.ts";

Deno.bench(
  "indexable_collection - upsertByPrimaryIndex (insert)",
  async (b) => {
    await useDb(async (db) => {
      b.start();
      await db.i_users.upsertByPrimaryIndex({
        index: ["username", mockUser1.username],
        set: mockUser1,
        update: { age: 30 },
      });
      b.end();
    });
  },
);

Deno.bench(
  "indexable_collection - upsertByPrimaryIndex (update)",
  async (b) => {
    await useDb(async (db) => {
      await db.i_users.add(mockUser1);

      b.start();
      await db.i_users.upsertByPrimaryIndex({
        index: ["username", mockUser1.username],
        set: mockUser1,
        update: { age: 30 },
      });
      b.end();
    });
  },
);
