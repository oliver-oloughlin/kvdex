import { denoCoreSerialize as serialize } from "../../src/utils.ts"
import { assert } from "jsr:@std/assert@0.215/assert"
import {
  val1,
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
  val2,
  val20,
  val21,
  val22,
  val23,
  val24,
  val25,
  val26,
  val27,
  val28,
  val29,
  val3,
  val4,
  val5,
  val6,
  val7,
  val8,
  val9,
} from "../values.ts"

Deno.test("utils - denoCoreSerialize", async (t) => {
  await t.step(
    "Should successfully serialize all KvValue type values",
    () => {
      const s1 = serialize(val1)
      const s2 = serialize(val2)
      const s3 = serialize(val3)
      const s4 = serialize(val4)
      const s5 = serialize(val5)
      const s6 = serialize(val6)
      const s7 = serialize(val7)
      const s8 = serialize(val8)
      const s9 = serialize(val9)
      const s10 = serialize(val10)
      const s11 = serialize(val11)
      const s12 = serialize(val12)
      const s13 = serialize(val13)
      const s14 = serialize(val14)
      const s15 = serialize(val15)
      const s16 = serialize(val16)
      const s17 = serialize(val17)
      const s18 = serialize(val18)
      const s19 = serialize(val19)
      const s20 = serialize(val20)
      const s21 = serialize(val21)
      const s22 = serialize(val22)
      const s23 = serialize(val23)
      const s24 = serialize(val24)
      const s25 = serialize(val25)
      const s26 = serialize(val26)
      const s27 = serialize(val27)
      const s28 = serialize(val28)
      const s29 = serialize(val29)

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
      assert(s27 instanceof Uint8Array)
      assert(s28 instanceof Uint8Array)
      assert(s29 instanceof Uint8Array)
    },
  )
})
