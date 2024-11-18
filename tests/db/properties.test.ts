import { openKv } from "npm:@deno/kv";
import { kvdex } from "../../mod.ts";

Deno.test("db - properties", async (t) => {
  await t.step("Should allow native Deno KV type", async () => {
    const kv = await Deno.openKv();
    kvdex({ kv });
    kv.close();
  });

  await t.step("Should allow NPM Deno KV type", async () => {
    const kv = await openKv();
    kvdex({ kv });
    kv.close();
  });
});
