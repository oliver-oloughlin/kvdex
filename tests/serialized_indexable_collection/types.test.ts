import { collection, kvdex, model } from "../../mod.ts";
import { jsonEncoder } from "../../src/ext/encoding/json.ts";
import { assert, assertEquals } from "../test.deps.ts";
import { useKv } from "../utils.ts";
import { TObject } from "../values.ts";

Deno.test("serialized_indexable_collection - types", async (t) => {
  await t.step(
    "Should allow and properly store/retrieve all KvValue types",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          objects: collection(model<typeof TObject>(), {
            encoder: jsonEncoder(),
            indices: {
              TString: "primary",
              TNumber: "secondary",
            },
          }),
        });

        const cr = await db.objects.add(TObject);
        assert(cr.ok);

        const doc = await db.objects.find(cr.id);
        assertEquals(doc?.value, TObject);
      });
    },
  );
});
