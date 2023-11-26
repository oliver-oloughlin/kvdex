import { kvdex } from "../../mod.ts"
import { assert } from "../deps.ts"
import { createResolver, sleep, useDb, useKv } from "../utils.ts"

Deno.test("db - loop", async (t) => {
  await t.step(
    "Should run both loops for 0 iterations, by terminating before the first task is called",
    async () => {
      await useDb(async (db) => {
        const sleeper1 = createResolver()
        const sleeper2 = createResolver()
        let count1 = 0
        let count2 = 0

        const listener1 = db.loop("l1", () => count1++, {
          exitOn: ({ first }) => first,
          onExit: () => sleeper1.resolve(),
        })

        const listener2 = db.loop("l2", () => count2++, {
          exitOn: (msg) => msg.count < 1,
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
          "l1",
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
    },
  )

  await t.step(
    "Should not initialize second loop with identical name",
    async () => {
      await useDb(async (db) => {
        const sleeper = createResolver()

        let count1 = 0
        let count2 = 0

        const listener1 = db.loop("l1", () => count1++, {
          exitOn: ({ count }) => count === 10,
          onExit: () => sleeper.resolve(),
          delay: 50,
        })

        await sleep(10)

        const listener2 = db.loop("l1", () => count2++, {
          exitOn: ({ count }) => count === 10,
          onExit: () => sleeper.resolve(),
          delay: 25,
        })

        await sleeper.promise

        assert(count1 === 10)
        assert(count2 === 0)

        return async () => await Promise.all([listener1, listener2])
      })
    },
  )
})
