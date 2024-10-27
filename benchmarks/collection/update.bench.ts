import { mockUser1 } from "../../tests/mocks.ts";
import type { User } from "../../tests/models.ts";
import { useDb } from "../../tests/utils.ts";

Deno.bench("collection - update (replace)", async (b) => {
  await useDb(async (db) => {
    const id = "id";
    await db.u64s.set(id, new Deno.KvU64(100n));

    const updateData = new Deno.KvU64(200n);

    b.start();
    await db.u64s.update(id, updateData);
    b.end();
  });
});

Deno.bench("collection - update (shallow merge)", async (b) => {
  await useDb(async (db) => {
    const id = "id";
    await db.users.set(id, mockUser1);

    const updateData: Partial<User> = {
      address: {
        country: "USA",
        city: "Los Angeles",
        street: "Sesame Street",
        houseNr: null,
      },
    };

    b.start();
    await db.users.update(id, updateData, { strategy: "merge-shallow" });
    b.end();
  });
});

Deno.bench("collection - update (deep merge)", async (b) => {
  await useDb(async (db) => {
    const id = "id";
    await db.users.set(id, mockUser1);

    const updateData: Partial<User> = {
      address: {
        country: "USA",
        city: "Los Angeles",
        street: "Sesame Street",
        houseNr: null,
      },
    };

    b.start();
    await db.users.update(id, updateData, { strategy: "merge" });
    b.end();
  });
});
