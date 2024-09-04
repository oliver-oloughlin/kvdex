import { MapKv } from "../../src/ext/map_kv/kv.ts"
import { assert } from "../test.deps.ts"
import { sleep } from "../utils.ts"

Deno.test("ext - map_kv", async (t) => {
  await t.step("set", async (t) => {
    await t.step("Should set new entry", () => {
      const kv = new MapKv()
      const key = ["test"]

      const cr = kv.set(key, 10)
      const entry = kv.get(key)
      assert(cr.ok)
      assert(entry.value !== null)
      assert(entry.versionstamp !== null)
    })

    await t.step("Should remove new entry after expire time", async () => {
      const kv = new MapKv()
      const key = ["test"]

      const cr = kv.set(key, 10, { expireIn: 100 })
      const entry1 = kv.get(key)
      assert(cr.ok)
      assert(entry1.value !== null)
      assert(entry1.versionstamp !== null)

      await sleep(500)

      const entry2 = kv.get(key)
      assert(entry2.value === null)
      assert(entry2.versionstamp === null)
    })
  })

  await t.step("get", async (t) => {
    await t.step("Should successfully get entry by key", () => {
      const kv = new MapKv()
      const key = ["test"]
      const val = 10

      const cr = kv.set(key, val)
      const entry = kv.get(key)
      assert(cr.ok)
      assert(entry.value === val)
      assert(entry.versionstamp !== null)
    })
  })

  await t.step("getMany", async (t) => {
    await t.step("Should successfully get entries by keys", () => {
      const kv = new MapKv()
      const entries = [
        [["test", 1], 10],
        [["test", 2], 20],
        [["test", 3], 30],
      ]

      const crs = entries.map(([key, val]) => kv.set(key as any, val))
      assert(crs.every((cr) => cr.ok))

      const getEntries = kv.getMany(entries.map(([k]) => k as any))

      getEntries.forEach((entry) => {
        assert(entries.some(([_, val]) => val === entry.value))
      })
    })
  })

  await t.step("delete", async (t) => {
    await t.step("Should successfully delete entry by key", () => {
      const kv = new MapKv()
      const key = ["test"]

      const cr = kv.set(key, 10)
      const entry1 = kv.get(key)
      assert(cr.ok)
      assert(entry1.value !== null)
      assert(entry1.versionstamp !== null)

      kv.delete(key)

      const entry2 = kv.get(key)
      assert(entry2.value === null)
      assert(entry2.versionstamp === null)
    })
  })

  await t.step("list", async (t) => {
    await t.step("Should list all entries in ascending order", async () => {
      const kv = new MapKv()
      const entries = [
        [["test", 1], 10],
        [["test", 2], 20],
        [["test", 3], 30],
      ]

      const crs = entries.map(([key, val]) => kv.set(key as any, val))
      assert(crs.every((cr) => cr.ok))

      const iter = kv.list({ prefix: [] })
      const listEntries = await Array.fromAsync(iter)

      listEntries.forEach((entry, i) => {
        assert(entry.value === entries[i][1])
      })
    })
  })
})
