import { openKv } from "@deno/kv";
import { kvdex } from "../../mod.ts";
import { MapKv, StorageAdapter } from "@olli/kvdex/kv";
import { IndexedDbKv } from "../../src/ext/kv/indexed_db/indexed_db_kv.ts";
import { openIndexedDb } from "../../src/ext/kv/indexed_db/utils.ts";
import "fake-indexeddb/auto";

Deno.test("db - properties", async (t) => {
  await t.step("Should allow native Deno KV type", async () => {
    const kv = await Deno.openKv(":memory:");
    kvdex({ kv });
    kv.close();
  });

  await t.step("Should allow NPM Deno KV type", async () => {
    const kv = await openKv(":memory:");
    kvdex({ kv });
    kv.close();
  });

  await t.step("Should allow in-memory Map KV type", async () => {
    const kv = new MapKv({ map: new Map() });
    kvdex({ kv });
    await kv.close();
  });

  await t.step("Should allow local storage Map KV type", async () => {
    const kv = new MapKv({ map: new StorageAdapter(localStorage) });
    kvdex({ kv });
    await kv.close();
  });

  await t.step("Should allow IndexedDB KV type", async () => {
    const db = await openIndexedDb({
      name: "kvdex_test_db",
      stores: { "__kvdex_store__": null },
    });

    const kv = new IndexedDbKv({ db });
    kvdex({ kv });
    kv.close();
  });
});
