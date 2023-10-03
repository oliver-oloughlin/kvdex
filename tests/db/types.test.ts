import { collection, kvdex } from "../../mod.ts"
import { assert } from "../deps.ts"
import { useKv } from "../utils.ts"

Deno.test("db - types", async (t) => {
  await t.step(
    "Should allow and properly store/retrieve all primitive types",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          strings: collection<string>().build(),
          numbers: collection<number>().build(),
          bigints: collection<bigint>().build(),
          u64s: collection<Deno.KvU64>().build(),
        })

        await db.strings.add("str1")
        await db.numbers.add(1)
        await db.bigints.add(1n)
        await db.u64s.add(new Deno.KvU64(1n))

        await db.strings.forEach((doc) => assert(typeof doc.value === "string"))
        await db.numbers.forEach((doc) => assert(typeof doc.value === "number"))
        await db.bigints.forEach((doc) => assert(typeof doc.value === "bigint"))
        await db.u64s.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Deno.KvU64,
          )
        )
      })
    },
  )

  await t.step(
    "Should allow and properly store/retrieve built-in object types",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          dates: collection<Date>().build(),
          sets: collection<Set<string>>().build(),
          maps: collection<Map<string, number>>().build(),
          regExps: collection<RegExp>().build(),
          dataVeiws: collection<DataView>().build(),
          errors: collection<Error>().build(),
        })

        await db.dates.add(new Date())
        await db.sets.add(new Set())
        await db.maps.add(new Map())
        await db.regExps.add(new RegExp("^[0-9]$"))
        await db.dataVeiws.add(new DataView(new ArrayBuffer(16)))
        await db.errors.add(new Error("error"))

        await db.dates.forEach((doc) =>
          assert(typeof doc.value === "object" && doc.value instanceof Date)
        )

        await db.sets.forEach((doc) =>
          assert(typeof doc.value === "object" && doc.value instanceof Set)
        )

        await db.maps.forEach((doc) =>
          assert(typeof doc.value === "object" && doc.value instanceof Map)
        )

        await db.regExps.forEach((doc) =>
          assert(typeof doc.value === "object" && doc.value instanceof RegExp)
        )

        await db.dataVeiws.forEach((doc) =>
          assert(typeof doc.value === "object" && doc.value instanceof DataView)
        )

        await db.errors.forEach((doc) =>
          assert(typeof doc.value === "object" && doc.value instanceof Error)
        )
      })
    },
  )

  await t.step(
    "Should allow and properly store/retrieve array types",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          arrs: collection<Array<string>>().build(),
          i8arrs: collection<Int8Array>().build(),
          i16arrs: collection<Int16Array>().build(),
          i32arrs: collection<Int32Array>().build(),
          i64arrs: collection<BigInt64Array>().build(),
          u8arrs: collection<Uint8Array>().build(),
          u16arrs: collection<Uint16Array>().build(),
          u32arrs: collection<Uint32Array>().build(),
          u64arrs: collection<BigUint64Array>().build(),
          u8carrs: collection<Uint8ClampedArray>().build(),
          f32arrs: collection<Float32Array>().build(),
          f64arrs: collection<Float64Array>().build(),
          buffers: collection<ArrayBuffer>().build(),
        })

        await db.arrs.add(["str1", "str2", "str3"])
        await db.i8arrs.add(new Int8Array([1, 2, 3]))
        await db.i16arrs.add(new Int16Array([1, 2, 3]))
        await db.i32arrs.add(new Int32Array([1, 2, 3]))
        await db.i64arrs.add(new BigInt64Array([1n, 2n, 3n]))
        await db.u8arrs.add(new Uint8Array([1, 2, 3]))
        await db.u16arrs.add(new Uint16Array([1, 2, 3]))
        await db.u32arrs.add(new Uint32Array([1, 2, 3]))
        await db.u64arrs.add(new BigUint64Array([1n, 2n, 3n]))
        await db.u8carrs.add(new Uint8ClampedArray([1, 2, 3]))
        await db.f32arrs.add(new Float32Array([1.0, 2.0, 3.0]))
        await db.f64arrs.add(new Float64Array([1.0, 2.0, 3.0]))
        await db.buffers.add(new ArrayBuffer(16))

        await db.arrs.forEach((doc) =>
          assert(typeof doc.value === "object" && doc.value instanceof Array)
        )
        await db.i8arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Int8Array,
          )
        )
        await db.i16arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Int16Array,
          )
        )
        await db.i32arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Int32Array,
          )
        )
        await db.i64arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof BigInt64Array,
          )
        )
        await db.u8arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Uint8Array,
          )
        )
        await db.u16arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Uint16Array,
          )
        )
        await db.u32arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Uint32Array,
          )
        )
        await db.u64arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" &&
              doc.value instanceof BigUint64Array,
          )
        )
        await db.u8carrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" &&
              doc.value instanceof Uint8ClampedArray,
          )
        )
        await db.f32arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Float32Array,
          )
        )
        await db.f64arrs.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof Float64Array,
          )
        )
        await db.buffers.forEach((doc) =>
          assert(
            typeof doc.value === "object" && doc.value instanceof ArrayBuffer,
          )
        )
      })
    },
  )
})
