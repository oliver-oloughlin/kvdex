import { openKv } from "@deno/kv";
import { kvdex } from "../../mod.ts";
import { mapKv, storageAdapter } from "@olli/kvdex/kv";
import "fake-indexeddb/auto";
import { indexedDbAdapter } from "../../src/ext/kv/map/indexed_db_adapter.ts";

Deno.test({
  name: "db - properties",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
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
      const kv = mapKv({ map: new Map(), clearOnClose: true });
      kvdex({ kv });
      await kv.close();
    });

    await t.step("Should allow local storage Map KV type", async () => {
      const kv = mapKv({
        map: storageAdapter(localStorage),
        clearOnClose: true,
      });

      kvdex({ kv });
      await kv.close();
    });

    await t.step("Should allow IndexedDB Map KV type", async () => {
      const map = await indexedDbAdapter();
      const kv = mapKv({ map, clearOnClose: true });
      kvdex({ kv });
      await kv.close();
    });
  },
});
