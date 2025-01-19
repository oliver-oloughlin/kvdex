import { MapKv } from "../../src/ext/kv/map_kv.ts";
import { StorageAdapter } from "../../src/ext/kv/mod.ts";
import { assert, assertEquals } from "@std/assert";
import { sleep } from "../utils.ts";

async function useStore(fn: (store: StorageAdapter<any, any>) => unknown) {
  const store = new StorageAdapter(localStorage);
  await fn(store);
  store.clear();
}

Deno.test("ext - kv", async (t) => {
  await t.step("set", async (t) => {
    await t.step("Should set new entry", async () => {
      const kv = new MapKv();
      const key = ["test"];

      const cr = await kv.set(key, 10);
      const entry = await kv.get(key);
      assert(cr.ok);
      assert(entry.value !== null);
      assert(entry.versionstamp !== null);
    });

    await t.step("Should remove new entry after expire time", async () => {
      const kv = new MapKv();
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

  await t.step("get", async (t) => {
    await t.step("Should successfully get entry by key", async () => {
      const kv = new MapKv();
      const key = ["test"];
      const val = 10;

      const cr = await kv.set(key, val);
      const entry = await kv.get(key);
      assert(cr.ok);
      assert(entry.value === val);
      assert(entry.versionstamp !== null);
    });
  });

  await t.step("getMany", async (t) => {
    await t.step("Should successfully get entries by keys", async () => {
      const kv = new MapKv();
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

  await t.step("delete", async (t) => {
    await t.step("Should successfully delete entry by key", async () => {
      const kv = new MapKv();
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

  await t.step("list", async (t) => {
    await t.step("Should list all entries in ascending order", async () => {
      const kv = new MapKv();
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

  await t.step("storage_adapter (localStorage)", async (t) => {
    await t.step("Should set and get new entry", async () => {
      await useStore((store) => {
        const key = "key";
        const val = 10;
        store.set(key, val);
        const item = store.get(key);
        assertEquals(val, item);
      });
    });

    await t.step("Should get all entries", async () => {
      await useStore((store) => {
        const entries = [
          ["1", 10],
          ["2", 20],
          ["3", 30],
          ["4", 40],
          ["5", 50],
        ] as const;

        for (const [key, val] of entries) {
          store.set(key, val);
        }

        const storeEntries = Array.from(store.entries());
        assertEquals(entries.length, storeEntries.length);

        for (const [key, val] of storeEntries) {
          assert(entries.some(([k, v]) => k === key && v === val));
        }
      });
    });

    await t.step("Should delete entry by key", async () => {
      await useStore((store) => {
        const key = "key";
        const val = 10;
        store.set(key, val);
        const item1 = store.get(key);
        assertEquals(item1, val);
        store.delete(key);
        const item2 = store.get(key);
        assertEquals(item2, undefined);
      });
    });

    await t.step("Should delete entry by key", async () => {
      await useStore((store) => {
        const entries = [
          ["1", 10],
          ["2", 20],
          ["3", 30],
          ["4", 40],
          ["5", 50],
        ] as const;

        for (const [key, val] of entries) {
          store.set(key, val);
        }

        const storeEntries1 = Array.from(store.entries());
        assertEquals(storeEntries1.length, entries.length);

        store.clear();
        const storeEntries2 = Array.from(store.entries());
        assertEquals(storeEntries2.length, 0);
      });
    });
  });
});
