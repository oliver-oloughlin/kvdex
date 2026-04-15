import { assert, assertEquals } from "@std/assert";
import { sleep, useIndexedDbMap, useMapKv, useStorageMap } from "../utils.ts";
import { MapKv } from "../../src/ext/kv/map/mod.ts";
import type { BasicMap } from "../../src/ext/kv/map/types.ts";

/** A BasicMap wrapper that delays `set` to simulate slow initialization. */
class SlowMap<K, V> implements BasicMap<K, V> {
  private inner = new Map<K, V>();
  private delay: number;

  constructor(delay = 50) {
    this.delay = delay;
  }

  async set(key: K, value: V) {
    await new Promise((r) => setTimeout(r, this.delay));
    this.inner.set(key, value);
  }

  get(key: K) {
    return this.inner.get(key);
  }

  delete(key: K) {
    return this.inner.delete(key);
  }

  entries() {
    return this.inner.entries();
  }

  clear() {
    this.inner.clear();
  }
}

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

    await t.step("readiness", async (t) => {
      const initEntries = [
        { key: ["a", 1], value: "alpha", versionstamp: "00000000000000000001" },
        { key: ["a", 2], value: "beta", versionstamp: "00000000000000000002" },
        { key: ["a", 3], value: "gamma", versionstamp: "00000000000000000003" },
      ];

      await t.step(
        "get should not complete before ready",
        async () => {
          const kv = new MapKv({
            map: new SlowMap(),
            entries: initEntries,
          });

          let readyTimestamp = 0;
          const promise = kv["ready"].then(() => readyTimestamp = Date.now());

          await kv.get(["a", 1]);
          const opTimestamp = Date.now();
          await promise;

          assert(readyTimestamp > 0, "ready should have resolved");
          assert(
            opTimestamp >= readyTimestamp,
            `get completed (${opTimestamp}) before ready resolved (${readyTimestamp})`,
          );
          await kv.close();
        },
      );

      await t.step(
        "getMany should not complete before ready",
        async () => {
          const kv = new MapKv({
            map: new SlowMap(),
            entries: initEntries,
          });

          let readyTimestamp = 0;
          const promise = kv["ready"].then(() => readyTimestamp = Date.now());

          await kv.getMany([["a", 1], ["a", 2]]);
          const opTimestamp = Date.now();
          await promise;

          assert(readyTimestamp > 0, "ready should have resolved");
          assert(
            opTimestamp >= readyTimestamp,
            `getMany completed (${opTimestamp}) before ready resolved (${readyTimestamp})`,
          );
          await kv.close();
        },
      );

      await t.step(
        "set should not complete before ready",
        async () => {
          const kv = new MapKv({
            map: new SlowMap(),
            entries: initEntries,
          });

          let readyTimestamp = 0;
          const promise = kv["ready"].then(() => readyTimestamp = Date.now());

          await kv.set(["b", 1], "new");
          const opTimestamp = Date.now();
          await promise;

          assert(readyTimestamp > 0, "ready should have resolved");
          assert(
            opTimestamp >= readyTimestamp,
            `set completed (${opTimestamp}) before ready resolved (${readyTimestamp})`,
          );
          await kv.close();
        },
      );

      await t.step(
        "delete should not complete before ready",
        async () => {
          const kv = new MapKv({
            map: new SlowMap(),
            entries: initEntries,
          });

          let readyTimestamp = 0;
          const promise = kv["ready"].then(() => readyTimestamp = Date.now());

          await kv.delete(["a", 1]);
          const opTimestamp = Date.now();
          await promise;

          assert(readyTimestamp > 0, "ready should have resolved");
          assert(
            opTimestamp >= readyTimestamp,
            `delete completed (${opTimestamp}) before ready resolved (${readyTimestamp})`,
          );
          await kv.close();
        },
      );

      await t.step(
        "list should not complete before ready",
        async () => {
          const kv = new MapKv({
            map: new SlowMap(),
            entries: initEntries,
          });

          let readyTimestamp = 0;
          const promise = kv["ready"].then(() => readyTimestamp = Date.now());

          await kv.list({ prefix: ["a"] });
          const opTimestamp = Date.now();
          await promise;

          assert(readyTimestamp > 0, "ready should have resolved");
          assert(
            opTimestamp >= readyTimestamp,
            `list completed (${opTimestamp}) before ready resolved (${readyTimestamp})`,
          );
          await kv.close();
        },
      );

      await t.step(
        "enqueue should not complete before ready",
        async () => {
          const kv = new MapKv({
            map: new SlowMap(),
            entries: initEntries,
          });

          let readyTimestamp = 0;
          const promise = kv["ready"].then(() => readyTimestamp = Date.now());

          await kv.enqueue("msg", { delay: 1000 });
          const opTimestamp = Date.now();
          await promise;

          assert(readyTimestamp > 0, "ready should have resolved");
          assert(
            opTimestamp >= readyTimestamp,
            `enqueue completed (${opTimestamp}) before ready resolved (${readyTimestamp})`,
          );
          await kv.close();
        },
      );

      await t.step(
        "close should not complete before ready",
        async () => {
          const kv = new MapKv({
            map: new SlowMap(),
            entries: initEntries,
          });

          let readyTimestamp = 0;
          const promise = kv["ready"].then(() => readyTimestamp = Date.now());

          await kv.close();
          const opTimestamp = Date.now();
          await promise;

          assert(readyTimestamp > 0, "ready should have resolved");
          assert(
            opTimestamp >= readyTimestamp,
            `close completed (${opTimestamp}) before ready resolved (${readyTimestamp})`,
          );
        },
      );

      await t.step(
        "concurrent operations should all complete after ready",
        async () => {
          const kv = new MapKv({
            map: new SlowMap(),
            entries: initEntries,
          });

          let readyTimestamp = 0;
          const promise = kv["ready"].then(() => readyTimestamp = Date.now());

          await Promise.all([
            kv.get(["a", 1]),
            kv.getMany([["a", 2], ["a", 3]]),
            kv.set(["b", 1], "concurrent"),
            kv.list({ prefix: ["a"] }),
          ]);
          const opTimestamp = Date.now();
          await promise;

          assert(readyTimestamp > 0, "ready should have resolved");
          assert(
            opTimestamp >= readyTimestamp,
            `concurrent ops completed (${opTimestamp}) before ready resolved (${readyTimestamp})`,
          );
          await kv.close();
        },
      );
    });
  },
});
