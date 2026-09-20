import { collection, kvdex, model } from "../../mod.ts";
import { DEFAULT_BASE_KEY_PREFIX } from "../../src/core/constants.ts";
import { assert, assertEquals } from "@std/assert";
import { useKv } from "../utils.ts";
import { jsonEncoder } from "../../src/ext/encoding/mod.ts";

Deno.test("db - kvdex", async (t) => {
  await t.step(
    "Should namespace encoded documents, indices, history and atomic writes",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex({
          kv,
          basePath: ["tenant", 42],
          schema: {
            users: collection({
              model: model<{ name: string; age: number; data: string }>(),
              encoder: jsonEncoder(),
              history: true,
              indices: { name: "primary", age: "secondary" },
            }),
            numbers: collection<number>(),
          },
        });
        const value = { name: "user", age: 42, data: "x".repeat(70_000) };
        assert((await db.users.set("id", value)).ok);
        assert(
          (await db.atomic((schema) => schema.numbers).set("id", 1).commit())
            .ok,
        );
        assertEquals((await db.users.findBy("name", "user"))?.value, value);
        assertEquals((await db.users.getManyBy("age", 42)).result.length, 1);
        const { result: history } = await db.users.findHistory("id");
        assertEquals(history.length, 1);
        assert(history[0].type === "write");
        assertEquals(history[0].value, value);
        assertEquals(await db.countAll(), 2);
        let entryCount = 0;
        for await (const entry of await kv.list({ prefix: [] })) {
          assertEquals(entry.key.slice(0, 2), ["tenant", 42]);
          entryCount++;
        }
        assert(entryCount > 6);
        await db.deleteAll();
        assertEquals(await db.countAll(), 0);
        assertEquals((await db.users.findHistory("id")).result.length, 2);
        await db.wipe();
        for await (const _entry of await kv.list({ prefix: ["tenant", 42] })) {
          assert(false, "wipe must remove history and segments too");
        }
      });
    },
  );

  await t.step("Should isolate custom base paths", async () => {
    await useKv(async (kv) => {
      const schema = { nested: { numbers: collection<number>() } };
      const basePath: [string, number] = ["tenant", 42];
      const custom = kvdex({ kv, schema, basePath });
      const other = kvdex({ kv, schema, basePath: ["tenant", 43] });
      const defaults = kvdex({ kv, schema });
      assert(custom["basePath"] === basePath);

      for (const key of Object.values(custom.nested.numbers["keys"])) {
        assertEquals(key.slice(0, 2), ["tenant", 42]);
      }
      assertEquals(custom.nested.numbers["keys"].base, [
        "tenant",
        42,
        "nested",
        "numbers",
      ]);
      await custom.nested.numbers.set("same", 1);
      await other.nested.numbers.set("same", 2);
      await defaults.nested.numbers.set("same", 3);
      assertEquals((await custom.nested.numbers.find("same"))?.value, 1);
      assertEquals(await custom.countAll(), 1);
      await kv.set(["tenant", 42, "__undelivered__", "message"], "custom");
      assertEquals((await custom.findUndelivered("message"))?.value, "custom");
      assertEquals(await defaults.findUndelivered("message"), null);
      await custom.deleteUndelivered("message");
      assertEquals(await custom.findUndelivered("message"), null);
      await custom.wipe();
      assertEquals(await custom.countAll(), 0);
      assertEquals((await other.nested.numbers.find("same"))?.value, 2);
      assertEquals((await defaults.nested.numbers.find("same"))?.value, 3);
    });
  });

  await t.step(
    "Should create unique keys for collections with equal name in different nestings",
    async () => {
      await useKv((kv) => {
        const db = kvdex({
          kv,
          schema: {
            numbers: collection({ model: model<number>() }),
            nested: {
              numbers: collection({ model: model<number>() }),
            },
          },
        });

        const key1 = JSON.stringify(db.numbers["keys"].base);
        const key2 = JSON.stringify(db.nested.numbers["keys"].base);

        assert(key1 !== key2);
        assert(key1 === `["${DEFAULT_BASE_KEY_PREFIX}","numbers"]`);
        assert(key2 === `["${DEFAULT_BASE_KEY_PREFIX}","nested","numbers"]`);
      });
    },
  );
});
