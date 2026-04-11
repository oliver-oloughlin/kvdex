import { mockUser1, mockUser2 } from "../../tests/mocks.ts";
import { useDb } from "../../tests/utils.ts";

Deno.bench("collection - upsert (insert)", async (b) => {
  await useDb(async (db) => {
    b.start();
    await db.users.upsert({
      id: "id",
      set: mockUser1,
      update: { age: 30 },
    });
    b.end();
  });
});

Deno.bench("collection - upsert (update)", async (b) => {
  await useDb(async (db) => {
    await db.users.set("id", mockUser1);

    b.start();
    await db.users.upsert({
      id: "id",
      set: mockUser2,
      update: { age: 30 },
    });
    b.end();
  });
});
