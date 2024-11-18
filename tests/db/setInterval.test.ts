import { assert } from "@std/assert";
import { createResolver, useDb } from "../utils.ts";

Deno.test("db - setInterval", async (t) => {
  await t.step(
    "Should run callback function given amount of times",
    async () => {
      await useDb(async (db) => {
        let count1 = 0;
        let count2 = 0;
        let count3 = 0;

        const sleeper1 = createResolver();
        const sleeper2 = createResolver();
        const sleeper3 = createResolver();

        const l1 = db.setInterval(() => count1++, 10, {
          while: ({ count }) => count < 2,
          onExit: sleeper1.resolve,
        });

        const l2 = db.setInterval(
          () => count2++,
          () => Math.random() * 20,
          {
            while: ({ first }) => !first,
            onExit: sleeper2.resolve,
          },
        );

        const l3 = db.setInterval(() => count3++, 10, {
          while: ({ interval }) => interval <= 0,
          onExit: sleeper3.resolve,
        });

        await sleeper1.promise;
        await sleeper2.promise;
        await sleeper3.promise;

        assert(count1 === 2);
        assert(count2 === 0);
        assert(count3 === 1);

        return async () => await Promise.all([l1, l2, l3]);
      });
    },
  );
});
