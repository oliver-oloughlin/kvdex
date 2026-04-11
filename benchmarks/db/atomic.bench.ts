import { mockUser1, mockUser2 } from "../../tests/mocks.ts";
import { useDb } from "../../tests/utils.ts";

Deno.bench("db - atomic (add + commit)", async (b) => {
  await useDb(async (db) => {
    b.start();
    await db.atomic((s) => s.users).add(mockUser1).commit();
    b.end();
  });
});

Deno.bench("db - atomic (set + delete + commit)", async (b) => {
  await useDb(async (db) => {
    await db.users.set("to_delete", mockUser1);

    b.start();
    await db
      .atomic((s) => s.users)
      .set("id", mockUser2)
      .delete("to_delete")
      .commit();
    b.end();
  });
});

Deno.bench("db - atomic (check + set + commit)", async (b) => {
  await useDb(async (db) => {
    const cr = await db.users.set("id", mockUser1);
    if (!cr.ok) throw new Error("Setup failed");

    b.start();
    await db
      .atomic((s) => s.users)
      .check({ id: "id", versionstamp: cr.versionstamp })
      .set("id", mockUser2)
      .commit();
    b.end();
  });
});

Deno.bench("db - atomic (add multi-collection)", async (b) => {
  await useDb(async (db) => {
    b.start();
    await db
      .atomic((s) => s.users)
      .add(mockUser1)
      .select((s) => s.i_users)
      .add(mockUser2)
      .commit();
    b.end();
  });
});
