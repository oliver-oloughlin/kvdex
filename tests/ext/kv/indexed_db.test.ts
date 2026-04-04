import { assert } from "@std/assert";
import { sleep, useIndexedDbKv } from "../../utils.ts";

Deno.test("ext - kv - indexed_db", async (t) => {
  await t.step("set", async (t) => {
    await t.step("Should set new entry", async () => {
      await useIndexedDbKv(async (kv) => {
        const key = ["test"];
        const cr = await kv.set(key, 10);
        const entry = await kv.get(key);
        assert(cr.ok);
        assert(entry.value !== null);
        assert(entry.versionstamp !== null);
      });
    });

    await t.step("Should remove new entry after expire time", async () => {
      await useIndexedDbKv(async (kv) => {
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

  // await t.step("get", async (t) => {
  //   await t.step("Should successfully get entry by key", async () => {
  //     await useIndexedDbKv(async (kv) => {
  //       const key = ["test"];
  //       const val = 10;

  //       const cr = await kv.set(key, val);
  //       const entry = await kv.get(key);
  //       assert(cr.ok);
  //       assert(entry.value === val);
  //       assert(entry.versionstamp !== null);
  //     });
  //   });
  // });

  // await t.step("getMany", async (t) => {
  //   await t.step("Should successfully get entries by keys", async () => {
  //     await useIndexedDbKv(async (kv) => {
  //       const entries = [
  //         [["test", 1], 10],
  //         [["test", 2], 20],
  //         [["test", 3], 30],
  //       ];

  //       const crs = await Promise.all(
  //         entries.map(([key, val]) => kv.set(key as any, val)),
  //       );
  //       assert(crs.every((cr) => cr.ok));

  //       const getEntries = await kv.getMany(entries.map(([k]) => k as any));

  //       getEntries.forEach((entry) => {
  //         assert(entries.some(([_, val]) => val === entry.value));
  //       });
  //     });
  //   });
  // });

  // await t.step("delete", async (t) => {
  //   await t.step("Should successfully delete entry by key", async () => {
  //     await useIndexedDbKv(async (kv) => {
  //       const key = ["test"];

  //       const cr = await kv.set(key, 10);
  //       const entry1 = await kv.get(key);
  //       assert(cr.ok);
  //       assert(entry1.value !== null);
  //       assert(entry1.versionstamp !== null);

  //       await kv.delete(key);

  //       const entry2 = await kv.get(key);
  //       assert(entry2.value === null);
  //       assert(entry2.versionstamp === null);
  //     });
  //   });
  // });

  // await t.step("list", async (t) => {
  //   await t.step("Should list all entries in ascending order", async () => {
  //     await useIndexedDbKv(async (kv) => {
  //       const entries = [
  //         [["test", 1], 10],
  //         [["test", 2], 20],
  //         [["test", 3], 30],
  //       ];

  //       const crs = await Promise.all(
  //         entries.map(([key, val]) => kv.set(key as any, val)),
  //       );
  //       assert(crs.every((cr) => cr.ok));

  //       const iter = await kv.list({ prefix: [] });
  //       const listEntries = await Array.fromAsync(iter);

  //       listEntries.forEach((entry, i) => {
  //         assert(entry.value === entries[i][1]);
  //       });
  //     });
  //   });
  // });
});
