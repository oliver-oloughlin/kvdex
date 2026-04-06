import { assert, assertEquals } from "@std/assert";
import { sleep, useIndexedDbMap, useMapKv, useStorageMap } from "../utils.ts";

Deno.test({
  name: "ext - kv",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    await t.step("set", async (t) => {
      await t.step("Should set new entry", async () => {
        await useMapKv(async (kv) => {
          const key = ["test"];

          const cr = await kv.set(key, 10);
          const entry = await kv.get(key);
          assert(cr.ok);
          assert(entry.value !== null);
          assert(entry.versionstamp !== null);
        });
      });

      await t.step("Should remove new entry after expire time", async () => {
        await useMapKv(async (kv) => {
          const key = ["test"];
          const cr = await kv.set(key, 10, { expireIn: 100 });
          const entry1 = await kv.get(key);

          assert(cr.ok);
          assert(entry1.value !== null);
          assert(entry1.versionstamp !== null);

          await sleep(500);

          const entry2 = await kv.get(key);
          assert(entry2.value === null);
          assert(entry2.versionstamp === null);
        });
      });
    });

    await t.step("get", async (t) => {
      await t.step("Should successfully get entry by key", async () => {
        await useMapKv(async (kv) => {
          const key = ["test"];
          const val = 10;
          const cr = await kv.set(key, val);
          const entry = await kv.get(key);

          assert(cr.ok);
          assert(entry.value === val);
          assert(entry.versionstamp !== null);
        });
      });
    });

    await t.step("getMany", async (t) => {
      await t.step("Should successfully get entries by keys", async () => {
        await useMapKv(async (kv) => {
          const entries = [
            [["test", 1], 10],
            [["test", 2], 20],
            [["test", 3], 30],
          ];

          const crs = await Promise.all(
            entries.map(([key, val]) => kv.set(key as any, val)),
          );
          assert(crs.every((cr) => cr.ok));

          const getEntries = await kv.getMany(entries.map(([k]) => k as any));

          getEntries.forEach((entry) => {
            assert(entries.some(([_, val]) => val === entry.value));
          });
        });
      });
    });

    await t.step("delete", async (t) => {
      await t.step("Should successfully delete entry by key", async () => {
        await useMapKv(async (kv) => {
          const key = ["test"];

          const cr = await kv.set(key, 10);
          const entry1 = await kv.get(key);
          assert(cr.ok);
          assert(entry1.value !== null);
          assert(entry1.versionstamp !== null);

          await kv.delete(key);

          const entry2 = await kv.get(key);
          assert(entry2.value === null);
          assert(entry2.versionstamp === null);
        });
      });
    });

    await t.step("list", async (t) => {
      await t.step("Should list all entries in ascending order", async () => {
        await useMapKv(async (kv) => {
          const entries = [
            [["test", 1], 10],
            [["test", 2], 20],
            [["test", 3], 30],
          ];

          const crs = await Promise.all(
            entries.map(([key, val]) => kv.set(key as any, val)),
          );
          assert(crs.every((cr) => cr.ok));

          const iter = await kv.list({ prefix: [] });
          const listEntries = await Array.fromAsync(iter);

          listEntries.forEach((entry, i) => {
            assert(entry.value === entries[i][1]);
          });
        });
      });
    });

    await t.step("storage_adapter (localStorage)", async (t) => {
      await t.step("Should set and get new entry", async () => {
        await useStorageMap((map) => {
          const key = "key";
          const val = 10;
          map.set(key, val);
          const item = map.get(key);
          assertEquals(val, item);
        });
      });

      await t.step("Should get all entries", async () => {
        await useStorageMap((map) => {
          const entries = [
            ["1", 10],
            ["2", 20],
            ["3", 30],
            ["4", 40],
            ["5", 50],
          ] as const;

          for (const [key, val] of entries) {
            map.set(key, val);
          }

          const storeEntries = Array.from(map.entries());
          assertEquals(entries.length, storeEntries.length);

          for (const [key, val] of storeEntries) {
            assert(entries.some(([k, v]) => k === key && v === val));
          }
        });
      });

      await t.step("Should delete entry by key", async () => {
        await useStorageMap((map) => {
          const key = "key";
          const val = 10;
          map.set(key, val);
          const item1 = map.get(key);
          assertEquals(item1, val);
          map.delete(key);
          const item2 = map.get(key);
          assertEquals(item2, undefined);
        });
      });

      await t.step("Should delete all entries", async () => {
        await useStorageMap((map) => {
          const entries = [
            ["1", 10],
            ["2", 20],
            ["3", 30],
            ["4", 40],
            ["5", 50],
          ] as const;

          for (const [key, val] of entries) {
            map.set(key, val);
          }

          const storeEntries1 = Array.from(map.entries());
          assertEquals(storeEntries1.length, entries.length);

          map.clear();
          const storeEntries2 = Array.from(map.entries());
          assertEquals(storeEntries2.length, 0);
        });
      });
    });

    await t.step("indexed_db_adapter", async (t) => {
      await t.step("Should set and get new entry", async () => {
        await useIndexedDbMap(async (map) => {
          const key = "key";
          const val = 10;
          await map.set(key, val);
          const item = await map.get(key);
          assertEquals(val, item);
        });
      });

      await t.step("Should get all entries", async () => {
        await useIndexedDbMap(async (map) => {
          const entries = [
            ["1", 10],
            ["2", 20],
            ["3", 30],
            ["4", 40],
            ["5", 50],
          ] as const;

          for (const [key, val] of entries) {
            await map.set(key, val);
          }

          const storeEntries = await Array.fromAsync(map.entries());
          assertEquals(entries.length, storeEntries.length);

          for (const [key, val] of storeEntries) {
            assert(entries.some(([k, v]) => k === key && v === val));
          }
        });
      });

      await t.step("Should delete entry by key", async () => {
        await useIndexedDbMap(async (map) => {
          const key = "key";
          const val = 10;
          await map.set(key, val);
          const item1 = await map.get(key);
          assertEquals(item1, val);
          await map.delete(key);
          const item2 = await map.get(key);
          assertEquals(item2, undefined);
        });
      });

      await t.step("Should delete all entries", async () => {
        await useIndexedDbMap(async (map) => {
          const entries = [
            ["1", 10],
            ["2", 20],
            ["3", 30],
            ["4", 40],
            ["5", 50],
          ] as const;

          for (const [key, val] of entries) {
            await map.set(key, val);
          }

          const storeEntries1 = await Array.fromAsync(map.entries());
          assertEquals(storeEntries1.length, entries.length);

          await map.clear();
          const storeEntries2 = await Array.fromAsync(map.entries());
          assertEquals(storeEntries2.length, 0);
        });
      });
    });
  },
});
