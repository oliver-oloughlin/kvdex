import { assert, assertEquals } from "@std/assert";
import {
  sleep,
  useIndexedDbMap,
  useKv,
  useLocalStorageMap,
  useMapKv,
  useSessionStorageMap,
} from "../utils.ts";
import { mapKv } from "../../src/ext/kv/map/mod.ts";
import type { BasicMap } from "../../src/ext/kv/map/types.ts";
import { collection, kvdex } from "../../mod.ts";
import type { KvEntry } from "../../src/ext/kv/map/entry_handlers.ts";
import type {
  DenoKvListSelector,
  DenoKvStrictKeyPart,
} from "../../src/core/types.ts";

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
    await t.step(
      "KV list respects all key part type ordering and bounds",
      async () => {
        await useKv(async (kv) => {
          const ordered: DenoKvStrictKeyPart[] = [
            new Uint8Array(),
            new Uint8Array([0]),
            new Uint8Array([0, 1]),
            new Uint8Array([1]),
            "",
            "a",
            "b",
            -1n,
            1n,
            -1,
            1,
            false,
            true,
          ];

          for (const value of ordered.toReversed()) {
            assert((await kv.set(["mixed", value], value)).ok);
          }

          const cases: {
            selector: DenoKvListSelector;
            expected: DenoKvStrictKeyPart[];
          }[] = [
            {
              selector: { prefix: ["mixed"] },
              expected: ordered,
            },
            {
              selector: { start: ["mixed", 1n], end: ["mixed", 1] },
              expected: [1n, -1],
            },
          ];

          for (const [index, value] of ordered.entries()) {
            cases.push(
              {
                selector: { prefix: ["mixed"], start: ["mixed", value] },
                expected: ordered.slice(index),
              },
              {
                selector: { prefix: ["mixed"], end: ["mixed", value] },
                expected: ordered.slice(0, index),
              },
            );
          }

          for (const { selector, expected } of cases) {
            for (const reverse of [false, true]) {
              const entries = await Array.fromAsync(
                await kv.list(selector, { reverse }),
              );
              assertEquals(
                entries.map((entry) => entry.key[1]),
                reverse ? expected.toReversed() : expected,
              );
            }
          }
        });
      },
    );

    await t.step("KV list respects non-finite numeric bounds", async () => {
      await useKv(async (kv) => {
        for (const value of [NaN, Infinity, 0, -Infinity]) {
          for (const suffix of ["b", "a"]) {
            assert(
              (await kv.set(["range", value, suffix], `${value}:${suffix}`)).ok,
            );
          }
        }

        const ordered = [
          "-Infinity:a",
          "-Infinity:b",
          "0:a",
          "0:b",
          "Infinity:a",
          "Infinity:b",
          "NaN:a",
          "NaN:b",
        ];
        const cases: { selector: DenoKvListSelector; expected: string[] }[] = [
          { selector: { prefix: ["range"] }, expected: ordered },
          {
            selector: { prefix: ["range"], start: ["range", -Infinity] },
            expected: ordered,
          },
          {
            selector: { prefix: ["range"], end: ["range", -Infinity] },
            expected: [],
          },
          {
            selector: { prefix: ["range"], start: ["range", Infinity] },
            expected: ordered.slice(4),
          },
          {
            selector: { prefix: ["range"], end: ["range", Infinity] },
            expected: ordered.slice(0, 4),
          },
          {
            selector: { prefix: ["range"], start: ["range", NaN] },
            expected: ordered.slice(6),
          },
          {
            selector: { prefix: ["range"], end: ["range", NaN] },
            expected: ordered.slice(0, 6),
          },
          ...[-Infinity, Infinity, NaN].map((value) => ({
            selector: {
              start: ["range", value, "a"],
              end: ["range", value, "b"],
            },
            expected: [`${value}:a`],
          })),
        ];

        for (const { selector, expected } of cases) {
          for (const reverse of [false, true]) {
            const entries = await Array.fromAsync(
              await kv.list(selector, { reverse }),
            );
            assertEquals(
              entries.map((entry) => entry.value),
              reverse ? expected.toReversed() : expected,
            );
          }
        }
      });
    });

    await t.step(
      "KV list respects inclusive start and exclusive end bounds",
      async () => {
        await useKv(async (kv) => {
          for (const value of [1, 3, 5]) {
            assert((await kv.set(["range", value, "id"], value)).ok);
          }
          assert((await kv.set(["other", 3, "id"], 99)).ok);

          const cases: { selector: DenoKvListSelector; expected: number[] }[] =
            [
              {
                selector: { prefix: ["range"], start: ["range", 2] },
                expected: [3, 5],
              },
              {
                selector: { prefix: ["range"], end: ["range", 4] },
                expected: [1, 3],
              },
              {
                selector: { start: ["range", 3], end: ["range", 5] },
                expected: [3],
              },
              {
                selector: {
                  start: ["range", 3, "id"],
                  end: ["range", 5, "id"],
                },
                expected: [3],
              },
              {
                selector: { prefix: ["range"], end: ["range", 1, "id"] },
                expected: [],
              },
              {
                selector: { prefix: ["range"], start: ["range", 6] },
                expected: [],
              },
              {
                selector: { start: ["range", 0], end: ["range", 6] },
                expected: [1, 3, 5],
              },
            ];

          for (const { selector, expected } of cases) {
            for (const reverse of [false, true]) {
              const entries = await Array.fromAsync(
                await kv.list(selector, { reverse }),
              );
              assertEquals(
                entries.map((entry) => entry.value),
                reverse ? expected.toReversed() : expected,
              );
            }
          }
        });
      },
    );

    await t.step(
      "MapKv reopen preserves queue-named collections with an empty base path",
      async () => {
        const map = new Map<string, KvEntry>();
        const schema = {
          __kvdex_queue__: collection<{ value: string; timestamp: number }>(),
        };
        const value = { value: "document", timestamp: 0 };
        const original = mapKv({ map });
        try {
          const db = kvdex({ kv: original, basePath: [], schema });
          assert((await db.__kvdex_queue__.set("id", value)).ok);
          assert((await original.enqueue("message", { delay: 50 })).ok);
        } finally {
          await original.close();
        }

        const reopened = mapKv({ map });
        const received: unknown[] = [];
        const complete = Promise.withResolvers<void>();
        const timeout = setTimeout(
          () => complete.reject(new Error("Queue delivery timed out")),
          5_000,
        );
        const listener = reopened.listenQueue((message) => {
          received.push(message);
          if (message === "message") complete.resolve();
        });
        try {
          const db = kvdex({ kv: reopened, basePath: [], schema });
          await complete.promise;
          assertEquals(received, ["message"]);
          assertEquals((await db.__kvdex_queue__.find("id"))?.value, value);
        } finally {
          clearTimeout(timeout);
          await reopened.close();
          await listener;
        }
      },
    );

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
        await useLocalStorageMap((map) => {
          const key = "key";
          const val = 10;
          map.set(key, val);
          const item = map.get(key);
          assertEquals(val, item);
        });
      });

      await t.step("Should get all entries", async () => {
        await useLocalStorageMap((map) => {
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
        await useLocalStorageMap((map) => {
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
        await useLocalStorageMap((map) => {
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

    await t.step("storage_adapter (sessionStorage)", async (t) => {
      await t.step("Should set and get new entry", async () => {
        await useSessionStorageMap((map) => {
          const key = "key";
          const val = 10;
          map.set(key, val);
          const item = map.get(key);
          assertEquals(val, item);
        });
      });

      await t.step("Should get all entries", async () => {
        await useSessionStorageMap((map) => {
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
        await useSessionStorageMap((map) => {
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
        await useSessionStorageMap((map) => {
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
          const kv = mapKv({
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
          const kv = mapKv({
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
          const kv = mapKv({
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
          const kv = mapKv({
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
          const kv = mapKv({
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
          const kv = mapKv({
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
          const kv = mapKv({
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
          const kv = mapKv({
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
