import { KvValue } from "../mod.ts"

export const val1 = undefined
export const val2 = null
export const val3 = NaN
export const val4 = Infinity
export const val5 = 10
export const val6 = "string"
export const val7 = 10n
export const val8 = new Deno.KvU64(100n)
export const val9 = true
export const val10 = new Int8Array([10, 20, 30])
export const val11 = new Int16Array([10, 20, 30])
export const val12 = new Int32Array([10, 20, 30])
export const val13 = new BigInt64Array([10n, 20n, 30n])
export const val14 = new Uint8Array([10, 20, 30])
export const val15 = new Uint16Array([10, 20, 30])
export const val16 = new Uint32Array([10, 20, 30])
export const val17 = new BigUint64Array([10n, 20n, 30n])
export const val18 = new Uint8ClampedArray([10, 20, 30])
export const val19 = new Float32Array([10.203423878293472837429384])
export const val20 = new Float64Array([10.203423878293472837429384])
export const val21 = new Uint8Array([10, 20, 30]).buffer
export const val22 = new Date()
export const val23 = new RegExp("[0-9]")
export const val24 = new DataView(new Uint8Array([10, 20, 30]).buffer)
export const val25 = new Error("error")
export const val26 = [
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
  val24,
  val25,
]
export const val27 = {
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
  val24,
  val25,
  val26,
}
export const val28 = new Set<KvValue>(val26)
export const val29 = new Map<KvValue, KvValue>([
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
  ["val23", val23],
  ["val24", val24],
  ["val25", val25],
  ["val26", val26],
  ["val27", val27],
  ["val28", val28],
])
