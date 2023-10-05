import { collection, kvdex, Model } from "../../mod.ts"
import { KVDEX_KEY_PREFIX } from "../../src/constants.ts"
import { assert } from "../deps.ts"
import { useKv } from "../utils.ts"

Deno.test("db - kvdex", async (t) => {
  await t.step(
    "Should create unique keys for collections with equal name in different nestings",
    async () => {
      await useKv((kv) => {
        const db = kvdex(kv, {
          numbers: collection(new Model<number>()),
          nested: {
            numbers: collection(new Model<number>()),
          },
        })

        const key1 = JSON.stringify(db.numbers._keys.baseKey)
        const key2 = JSON.stringify(db.nested.numbers._keys.baseKey)

        assert(key1 !== key2)
        assert(key1 === `["${KVDEX_KEY_PREFIX}","numbers"]`)
        assert(key2 === `["${KVDEX_KEY_PREFIX}","nested","numbers"]`)
      })
    },
  )
})
