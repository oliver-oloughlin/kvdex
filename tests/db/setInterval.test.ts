import { assert } from "../deps.ts"
import { createResolver, sleep, useDb } from "../utils.ts"

Deno.test("db - setInterval", async (t) => {
  await t.step(
    "Should run callback function given amount of times",
    async () => {
      await useDb(async (db) => {
        let count1 = 0
        let count2 = 0
        let count3 = 0

        const sleeper1 = createResolver()
        const sleeper2 = createResolver()
        const sleeper3 = createResolver()

        const l1 = db.setInterval("i1", () => count1++, {
          interval: 10,
          exitOn: ({ count }) => count === 2,
          onExit: sleeper1.resolve,
        })

        const l2 = db.setInterval("i2", () => count2++, {
          interval: () => Math.random() * 20,
          exitOn: ({ first }) => first,
          onExit: sleeper2.resolve,
        })

        const l3 = db.setInterval("i3", () => count3++, {
          interval: 10,
          exitOn: ({ interval }) => interval > 0,
          onExit: sleeper3.resolve,
        })

        await sleeper1.promise
        await sleeper2.promise
        await sleeper3.promise

        assert(count1 === 2)
        assert(count2 === 0)
        assert(count3 === 1)

        return async () => await Promise.all([l1, l2, l3])
      })
    },
  )

  await t.step(
    "Should not initialize second interval with identical name",
    async () => {
      await useDb(async (db) => {
        const sleeper = createResolver()

        let count1 = 0
        let count2 = 0

        const listener1 = db.setInterval("i1", () => count1++, {
          exitOn: ({ count }) => count === 10,
          onExit: () => sleeper.resolve(),
          interval: 50,
        })

        await sleep(10)

        const listener2 = db.setInterval("i1", () => count2++, {
          exitOn: ({ count }) => count === 10,
          onExit: () => sleeper.resolve(),
          interval: 25,
        })

        await sleeper.promise

        assert(count1 === 10)
        assert(count2 === 0)

        return async () => await Promise.all([listener1, listener2])
      })
    },
  )
})
