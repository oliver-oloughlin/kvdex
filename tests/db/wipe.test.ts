import { collection, kvdex, model } from "../../mod.ts";
import { assert, assertEquals } from "@std/assert";
import type { User } from "../models.ts";
import { generateLargeUsers, generateUsers, useKv } from "../utils.ts";
import { jsonEncoder } from "../../src/ext/encoding/mod.ts";

Deno.test("db - wipe", async (t) => {
  await t.step(
    "Should delete all kvdex entries from the database, including history entries",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex({
          kv,
          schema: {
            i_users: collection(model<User>(), {
              history: true,
              indices: {
                username: "primary",
                age: "secondary",
              },
            }),
            s_users: collection(model<User>(), {
              encoder: jsonEncoder(),
              history: true,
            }),
            u64s: collection(model<Deno.KvU64>(), {
              history: true,
            }),
          },
        });

        const users = generateUsers(100);
        const largeUsers = generateLargeUsers(100);
        const u64s = [
          new Deno.KvU64(10n),
          new Deno.KvU64(20n),
        ];

        const cr1 = await db.i_users.addMany(users);
        const cr2 = await db.s_users.addMany(largeUsers);
        const cr3 = await db.u64s.addMany(u64s);

        assert(cr1.ok);
        assert(cr2.ok);
        assert(cr3.ok);

        const { result: docs1 } = await db.i_users.getMany({ limit: 1 });
        const { result: docs2 } = await db.s_users.getMany({ limit: 1 });
        const { result: docs3 } = await db.u64s.getMany({ limit: 1 });

        const count1 = await db.countAll();
        assertEquals(count1, users.length + largeUsers.length + u64s.length);

        await db.wipe();

        const count2 = await db.countAll();
        const { result: h1 } = await db.i_users.findHistory(docs1[0].id);
        const { result: h2 } = await db.s_users.findHistory(docs2[0].id);
        const { result: h3 } = await db.u64s.findHistory(docs3[0].id);

        assert(count2 === 0);
        assert(h1.length === 0);
        assert(h2.length === 0);
        assert(h3.length === 0);
      });
    },
  );
});
