import { assert } from "@std/assert";
import { generateLargeUsers, generateUsers, useDb } from "../utils.ts";

Deno.test("db - countAll", async (t) => {
  await t.step(
    "Should correctly count all documents in the database",
    async () => {
      await useDb(async (db) => {
        const users = generateUsers(10);
        const largeUsers = generateLargeUsers(10);
        const u64s = [
          new Deno.KvU64(0n),
          new Deno.KvU64(0n),
        ];
        const nums = [1, 2, 3];
        const mpUsers = generateUsers(5);
        const mpU64s = [
          new Deno.KvU64(10n),
          new Deno.KvU64(20n),
        ];

        const cr1 = await db.i_users.addMany(users);
        const cr2 = await db.s_users.addMany(largeUsers);
        const cr3 = await db.u64s.addMany(u64s);
        const cr4 = await db.multi_part_id_nums.addMany(nums);
        const cr5 = await db.i_multi_part_id_users.addMany(mpUsers);
        const cr6 = await db.multi_part_id_u64s.addMany(mpU64s);

        assert(cr1.ok);
        assert(cr2.ok);
        assert(cr3.ok);
        assert(cr4.ok);
        assert(cr5.ok);
        assert(cr6.ok);

        const count = await db.countAll();
        assert(
          count ===
            users.length + largeUsers.length + u64s.length +
              nums.length + mpUsers.length + mpU64s.length,
        );
      });
    },
  );
});
