import { jsonDeserialize, jsonSerialize } from "../../src/utils.ts"
import { assert } from "../deps.ts"
import { KvValue } from "../../mod.ts"

const val1 = undefined
const val2 = null
const val3 = 10
const val4 = "string"
const val5 = 10n
const val6 = true
const val7 = new Int8Array([10, 20, 30])
const val8 = new Int16Array([10, 20, 30])
const val9 = new Int32Array([10, 20, 30])
const val10 = new BigInt64Array([10n, 20n, 30n])
const val11 = new Uint8Array([10, 20, 30])
const val12 = new Uint16Array([10, 20, 30])
const val13 = new Uint32Array([10, 20, 30])
const val14 = new BigUint64Array([10n, 20n, 30n])
const val15 = new Uint8ClampedArray([10, 20, 30])
const val16 = new Float32Array([10.203423878293472837429384])
const val17 = new Float64Array([10.203423878293472837429384])
const val18 = new Uint8Array([10, 20, 30]).buffer
const val19 = new Date()
const val20 = new RegExp("[0-9]")
const val21 = new DataView(new Uint8Array([10, 20, 30]).buffer)
const val22 = new Error("error")
const val23 = [
  val1,
  val2,
  val3,
  val4,
  val5,
  val6,
  val7,
  val8,
  val9,
  val10,
  val11,
  val12,
  val13,
  val14,
  val15,
  val16,
  val17,
  val18,
  val19,
  val20,
  val21,
  val22,
]
const val24 = {
  val1,
  val2,
  val3,
  val4,
  val5,
  val6,
  val7,
  val8,
  val9,
  val10,
  val11,
  val12,
  val13,
  val14,
  val15,
  val16,
  val17,
  val18,
  val19,
  val20,
  val21,
  val22,
  val23,
}
const val25 = new Set<KvValue>(val23)
const val26 = new Map<KvValue, KvValue>([
  ["val1", val1],
  ["val2", val2],
  ["val3", val3],
  ["val4", val4],
  ["val5", val5],
  ["val6", val6],
  ["val7", val7],
  ["val8", val8],
  ["val9", val9],
  ["val10", val10],
  ["val11", val11],
  ["val12", val12],
  ["val13", val13],
  ["val14", val14],
  ["val15", val15],
  ["val16", val16],
  ["val17", val17],
  ["val18", val18],
  ["val19", val19],
  ["val20", val20],
  ["val21", val21],
  ["val22", val22],
])

Deno.test("utils - jsonDeserialize", async (t) => {
  await t.step(
    "Should successfully deserialize all KvValue type values from Uint8Array",
    () => {
      const s1 = jsonSerialize(val1)
      const s2 = jsonSerialize(val2)
      const s3 = jsonSerialize(val3)
      const s4 = jsonSerialize(val4)
      const s5 = jsonSerialize(val5)
      const s6 = jsonSerialize(val6)
      const s7 = jsonSerialize(val7)
      const s8 = jsonSerialize(val8)
      const s9 = jsonSerialize(val9)
      const s10 = jsonSerialize(val10)
      const s11 = jsonSerialize(val11)
      const s12 = jsonSerialize(val12)
      const s13 = jsonSerialize(val13)
      const s14 = jsonSerialize(val14)
      const s15 = jsonSerialize(val15)
      const s16 = jsonSerialize(val16)
      const s17 = jsonSerialize(val17)
      const s18 = jsonSerialize(val18)
      const s19 = jsonSerialize(val19)
      const s20 = jsonSerialize(val20)
      const s21 = jsonSerialize(val21)
      const s22 = jsonSerialize(val22)
      const s23 = jsonSerialize(val23)
      const s24 = jsonSerialize(val24)
      const s25 = jsonSerialize(val25)
      const s26 = jsonSerialize(val26)

      const d1 = jsonDeserialize(s1)
      const d2 = jsonDeserialize(s2)
      const d3 = jsonDeserialize(s3)
      const d4 = jsonDeserialize(s4)
      const d5 = jsonDeserialize(s5)
      const d6 = jsonDeserialize(s6)
      const d7 = jsonDeserialize(s7)
      const d8 = jsonDeserialize(s8)
      const d9 = jsonDeserialize(s9)
      const d10 = jsonDeserialize(s10)
      const d11 = jsonDeserialize(s11)
      const d12 = jsonDeserialize(s12)
      const d13 = jsonDeserialize(s13)
      const d14 = jsonDeserialize(s14)
      const d15 = jsonDeserialize(s15)
      const d16 = jsonDeserialize(s16)
      const d17 = jsonDeserialize(s17)
      const d18 = jsonDeserialize(s18)
      const d19 = jsonDeserialize(s19)
      const d20 = jsonDeserialize(s20)
      const d21 = jsonDeserialize(s21)
      const d22 = jsonDeserialize(s22)
      const d23 = jsonDeserialize(s23)
      const d24 = jsonDeserialize(s24)
      const d25 = jsonDeserialize(s25)
      const d26 = jsonDeserialize(s26)

      assert(d1 === val1)
      assert(d2 === val2)
      assert(d3 === val3)
      assert(d4 === val4)
      assert(d5 === val5)
      assert(d6 === val6)
      assert(d7 instanceof Int8Array && d7.byteLength === val7.byteLength)
      assert(d8 instanceof Int16Array && d8.byteLength === val8.byteLength)
      assert(d9 instanceof Int32Array && d9.byteLength === val9.byteLength)
      assert(
        d10 instanceof BigInt64Array && d10.byteLength === val10.byteLength,
      )
      assert(d11 instanceof Uint8Array && d11.byteLength === val11.byteLength)
      assert(d12 instanceof Uint16Array && d12.byteLength === val12.byteLength)
      assert(d13 instanceof Uint32Array && d13.byteLength === val13.byteLength)
      assert(
        d14 instanceof BigUint64Array && d14.byteLength === val14.byteLength,
      )
      assert(
        d15 instanceof Uint8ClampedArray && d15.byteLength === val15.byteLength,
      )
      assert(d16 instanceof Float32Array && d16.byteLength === val16.byteLength)
      assert(d17 instanceof Float64Array && d17.byteLength === val17.byteLength)
      assert(d18 instanceof ArrayBuffer && d18.byteLength === val18.byteLength)
      assert(d19 instanceof Date && d19.valueOf() === val19.valueOf())
      assert(d20 instanceof RegExp && d20.source === val20.source)
      assert(d21 instanceof DataView && d21.byteLength === val21.byteLength)
      assert(
        d22 instanceof Error && d22.stack === val22.stack &&
          d22.message === d22.message,
      )
      assert(Array.isArray(d23))
      assert(
        typeof d24 === "object" &&
          Object.values(d24 as object).length === Object.values(val24).length,
      )
      assert(d25 instanceof Set && d25.size === val25.size)
      assert(d26 instanceof Map && d26.size === val26.size)
    },
  )
})
