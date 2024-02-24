import {
  denoCoreDeserialize as deserialize,
  denoCoreSerialize as serialize,
} from "../../src/utils.ts"
import { assertEquals } from "../test.deps.ts"
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

Deno.test("utils - denoCoreDeserialize", async (t) => {
  await t.step(
    "Should successfully deserialize all KvValue type values from Uint8Array",
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

      const d1 = deserialize(s1)
      const d2 = deserialize(s2)
      const d3 = deserialize(s3)
      const d4 = deserialize(s4)
      const d5 = deserialize(s5)
      const d6 = deserialize(s6)
      const d7 = deserialize(s7)
      const d8 = deserialize(s8)
      const d9 = deserialize(s9)
      const d10 = deserialize(s10)
      const d11 = deserialize(s11)
      const d12 = deserialize(s12)
      const d13 = deserialize(s13)
      const d14 = deserialize(s14)
      const d15 = deserialize(s15)
      const d16 = deserialize(s16)
      const d17 = deserialize(s17)
      const d18 = deserialize(s18)
      const d19 = deserialize(s19)
      const d20 = deserialize(s20)
      const d21 = deserialize(s21)
      const d22 = deserialize(s22)
      const d23 = deserialize(s23)
      const d24 = deserialize(s24)
      const d25 = deserialize(s25)
      const d26 = deserialize(s26)
      const d27 = deserialize(s27)
      const d28 = deserialize(s28)
      const d29 = deserialize(s29)

      assertEquals(d1, val1)
      assertEquals(d2, val2)
      assertEquals(d3, val3)
      assertEquals(d4, val4)
      assertEquals(d5, val5)
      assertEquals(d6, val6)
      assertEquals(d7, val7)
      assertEquals(d8, val8)
      assertEquals(d9, val9)
      assertEquals(d10, val10)
      assertEquals(d11, val11)
      assertEquals(d12, val12)
      assertEquals(d13, val13)
      assertEquals(d14, val14)
      assertEquals(d15, val15)
      assertEquals(d16, val16)
      assertEquals(d17, val17)
      assertEquals(d18, val18)
      assertEquals(d19, val19)
      assertEquals(d20, val20)
      assertEquals(d21, val21)
      assertEquals(d22, val22)
      assertEquals(d23, val23)
      assertEquals(d24, val24)
      assertEquals(d25, val25)
      assertEquals(d26, val26)
      assertEquals(d27, val27)
      assertEquals(d28, val28)
      assertEquals(d29, val29)
    },
  )
})
