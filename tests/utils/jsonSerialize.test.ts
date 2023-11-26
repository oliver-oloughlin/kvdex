import { jsonSerialize } from "../../src/utils.ts"
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

Deno.test("utils - jsonSerialize", async (t) => {
  await t.step(
    "Should successfully serialize all KvValue type values",
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

      assert(s1 instanceof Uint8Array)
      assert(s2 instanceof Uint8Array)
      assert(s3 instanceof Uint8Array)
      assert(s4 instanceof Uint8Array)
      assert(s5 instanceof Uint8Array)
      assert(s6 instanceof Uint8Array)
      assert(s7 instanceof Uint8Array)
      assert(s8 instanceof Uint8Array)
      assert(s9 instanceof Uint8Array)
      assert(s10 instanceof Uint8Array)
      assert(s11 instanceof Uint8Array)
      assert(s12 instanceof Uint8Array)
      assert(s13 instanceof Uint8Array)
      assert(s14 instanceof Uint8Array)
      assert(s15 instanceof Uint8Array)
      assert(s16 instanceof Uint8Array)
      assert(s17 instanceof Uint8Array)
      assert(s18 instanceof Uint8Array)
      assert(s19 instanceof Uint8Array)
      assert(s20 instanceof Uint8Array)
      assert(s21 instanceof Uint8Array)
      assert(s22 instanceof Uint8Array)
      assert(s23 instanceof Uint8Array)
      assert(s24 instanceof Uint8Array)
      assert(s25 instanceof Uint8Array)
      assert(s26 instanceof Uint8Array)
    },
  )
})
