import { kvdex } from "../../mod.ts"
import { assert } from "jsr:@std/assert@0.215/assert"
import { createResolver, useDb, useKv } from "../utils.ts"

Deno.test("db - loop", async (t) => {
  await t.step(
    "Should run both loops for 0 iterations, by terminating before the first task is called",
    async () => {
      await useDb(async (db) => {
        const sleeper1 = createResolver()
        const sleeper2 = createResolver()
        let count1 = 0
        let count2 = 0

        const listener1 = db.loop(() => count1++, {
          while: ({ first }) => !first,
          onExit: () => sleeper1.resolve(),
        })

        const listener2 = db.loop(() => count2++, {
          while: (msg) => msg.count >= 1,
          onExit: () => sleeper2.resolve(),
        })

        await sleeper1.promise
        await sleeper2.promise

        assert(count1 === 0)
        assert(count2 === 0)

        return async () => await Promise.all([listener1, listener2])
      })
    },
  )

  await t.step(
    "Should run loop for 10 iterations and carry accumulated result",
    async () => {
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
            while: ({ first, result }) => first || result < 10,
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
    },
  )
})
