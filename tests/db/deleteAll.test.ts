import { collection, kvdex, model } from "../../mod.ts";
import { assert, assertEquals } from "@std/assert";
import type { User } from "../models.ts";
import { generateLargeUsers, generateUsers, useKv } from "../utils.ts";
import { jsonEncoder } from "../../src/ext/encoding/mod.ts";
import { ulid } from "@std/ulid/ulid";
import type { KvId } from "../../src/core/types.ts";

Deno.test("db - deleteAll", async (t) => {
  await t.step(
    "Should delete all documents from the database without deleting history entries",
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
            mp_users: collection(model<User>(), {
              history: true,
              idGenerator: () => [ulid(), Math.random()] as KvId,
            }),
            mp_u64s: collection(model<Deno.KvU64>(), {
              history: true,
              idGenerator: () => [ulid(), Math.random()] as KvId,
            }),
          },
        });

        const users = generateUsers(100);
        const largeUsers = generateLargeUsers(100);
        const u64s = [
          new Deno.KvU64(10n),
          new Deno.KvU64(20n),
        ];
        const mpUsers = generateUsers(10);
        const mpU64s = [
          new Deno.KvU64(30n),
          new Deno.KvU64(40n),
        ];

        const cr1 = await db.i_users.addMany(users);
        const cr2 = await db.s_users.addMany(largeUsers);
        const cr3 = await db.u64s.addMany(u64s);
        const cr4 = await db.mp_users.addMany(mpUsers);
        const cr5 = await db.mp_u64s.addMany(mpU64s);

        assert(cr1.ok);
        assert(cr2.ok);
        assert(cr3.ok);
        assert(cr4.ok);
        assert(cr5.ok);

        const { result: docs1 } = await db.i_users.getMany({ limit: 1 });
        const { result: docs2 } = await db.s_users.getMany({ limit: 1 });
        const { result: docs3 } = await db.u64s.getMany({ limit: 1 });
        const { result: docs4 } = await db.mp_users.getMany({ limit: 1 });
        const { result: docs5 } = await db.mp_u64s.getMany({ limit: 1 });

        const count1 = await db.countAll();
        assertEquals(
          count1,
          users.length + largeUsers.length + u64s.length +
            mpUsers.length + mpU64s.length,
        );

        await db.deleteAll();

        const count2 = await db.countAll();
        const { result: h1 } = await db.i_users.findHistory(docs1[0].id);
        const { result: h2 } = await db.s_users.findHistory(docs2[0].id);
        const { result: h3 } = await db.u64s.findHistory(docs3[0].id);
        const { result: h4 } = await db.mp_users.findHistory(docs4[0].id);
        const { result: h5 } = await db.mp_u64s.findHistory(docs5[0].id);

        assert(count2 === 0);
        assert(h1.length > 0);
        assert(h2.length > 0);
        assert(h3.length > 0);
        assert(h4.length > 0);
        assert(h5.length > 0);
      });
    },
  );
});
