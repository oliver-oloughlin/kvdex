import { collection, kvdex, model } from "../../mod.ts"
import { assert } from "../test.deps.ts"
import { useKv } from "../utils.ts"

Deno.test("serialized_collection - types", async (t) => {
  await t.step(
    "Should allow and properly store/retrieve all primitive types",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          nulls: collection(model<null>(), { serialize: "json" }),
          undefineds: collection(model<undefined>(), { serialize: "json" }),
          strings: collection(model<string>(), { serialize: "json" }),
          numbers: collection(model<number>(), { serialize: "json" }),
          bigints: collection(model<bigint>(), { serialize: "json" }),
          u64s: collection(model<Deno.KvU64>(), { serialize: "json" }),
        })

        const cr1 = await db.nulls.add(null)
        const cr2 = await db.undefineds.add(undefined)
        const cr3 = await db.strings.add("str1")
        const cr4 = await db.numbers.add(1)
        const cr5 = await db.bigints.add(1n)
        const cr6 = await db.u64s.add(new Deno.KvU64(1n))

        assert(cr1.ok)
        assert(cr2.ok)
        assert(cr3.ok)
        assert(cr4.ok)
        assert(cr5.ok)
        assert(cr6.ok)

        await db.nulls.forEach((doc) => assert(doc.value === null))
        await db.undefineds.forEach((doc) => assert(doc.value === undefined))
        await db.strings.forEach((doc) => assert(typeof doc.value === "string"))
        await db.numbers.forEach((doc) => assert(typeof doc.value === "number"))
        await db.bigints.forEach((doc) => assert(typeof doc.value === "bigint"))
        await db.u64s.forEach((doc) =>
          assert(
            typeof doc.value === "object" &&
              typeof doc.value.value === "bigint",
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
          dates: collection(model<Date>(), { serialize: "json" }),
          sets: collection(model<Set<string>>(), { serialize: "json" }),
          maps: collection(model<Map<string, number>>(), { serialize: "json" }),
          regExps: collection(model<RegExp>(), { serialize: "json" }),
          dataVeiws: collection(model<DataView>(), { serialize: "json" }),
          errors: collection(model<Error>(), { serialize: "json" }),
        })

        const cr1 = await db.dates.add(new Date())
        const cr2 = await db.sets.add(new Set())
        const cr3 = await db.maps.add(new Map())
        const cr4 = await db.regExps.add(new RegExp("^[0-9]$"))
        const cr5 = await db.dataVeiws.add(new DataView(new ArrayBuffer(16)))
        const cr6 = await db.errors.add(new Error("error"))

        assert(cr1.ok)
        assert(cr2.ok)
        assert(cr3.ok)
        assert(cr4.ok)
        assert(cr5.ok)
        assert(cr6.ok)

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
          arrs: collection(model<Array<string>>(), { serialize: "json" }),
          i8arrs: collection(model<Int8Array>(), { serialize: "json" }),
          i16arrs: collection(model<Int16Array>(), { serialize: "json" }),
          i32arrs: collection(model<Int32Array>(), { serialize: "json" }),
          i64arrs: collection(model<BigInt64Array>(), { serialize: "json" }),
          u8arrs: collection(model<Uint8Array>(), { serialize: "json" }),
          u16arrs: collection(model<Uint16Array>(), { serialize: "json" }),
          u32arrs: collection(model<Uint32Array>(), { serialize: "json" }),
          u64arrs: collection(model<BigUint64Array>(), { serialize: "json" }),
          u8carrs: collection(model<Uint8ClampedArray>(), {
            serialize: "json",
          }),
          f32arrs: collection(model<Float32Array>(), { serialize: "json" }),
          f64arrs: collection(model<Float64Array>(), { serialize: "json" }),
          buffers: collection(model<ArrayBuffer>(), { serialize: "json" }),
        })

        const cr1 = await db.arrs.add(["str1", "str2", "str3"])
        const cr2 = await db.i8arrs.add(new Int8Array([1, 2, 3]))
        const cr3 = await db.i16arrs.add(new Int16Array([1, 2, 3]))
        const cr4 = await db.i32arrs.add(new Int32Array([1, 2, 3]))
        const cr5 = await db.i64arrs.add(new BigInt64Array([1n, 2n, 3n]))
        const cr6 = await db.u8arrs.add(new Uint8Array([1, 2, 3]))
        const cr7 = await db.u16arrs.add(new Uint16Array([1, 2, 3]))
        const cr8 = await db.u32arrs.add(new Uint32Array([1, 2, 3]))
        const cr9 = await db.u64arrs.add(new BigUint64Array([1n, 2n, 3n]))
        const cr10 = await db.u8carrs.add(new Uint8ClampedArray([1, 2, 3]))
        const cr11 = await db.f32arrs.add(new Float32Array([1.0, 2.0, 3.0]))
        const cr12 = await db.f64arrs.add(new Float64Array([1.0, 2.0, 3.0]))
        const cr13 = await db.buffers.add(new ArrayBuffer(16))

        assert(cr1.ok)
        assert(cr2.ok)
        assert(cr3.ok)
        assert(cr4.ok)
        assert(cr5.ok)
        assert(cr6.ok)
        assert(cr7.ok)
        assert(cr8.ok)
        assert(cr9.ok)
        assert(cr10.ok)
        assert(cr11.ok)
        assert(cr12.ok)
        assert(cr13.ok)

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
