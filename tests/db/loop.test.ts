import { kvdex } from "../../mod.ts"
import { assert } from "../deps.ts"
import { createResolver, useKv } from "../utils.ts"

Deno.test("db - loop", async (t) => {
  await t.step("Should run loop for 10 iterations", async () => {
    await useKv(async (kv) => {
      const db = kvdex(kv, {})
      const { resolve, promise } = createResolver()
      let count = 0

      const listener = db.loop<number>(
        ({ first, result }) => {
          count++
          return first ? 1 : result + 1
        },
        {
          exitOn: ({ result, first }) => !first && result >= 10,
          onExit: ({ result }) => {
            assert(result === 10)
            assert(count === 10)
            resolve()
          },
        },
      )

      await promise

      return async () => await listener
    })
  })
})
