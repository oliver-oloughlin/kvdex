import { jsonDeserialize, jsonSerialize } from "../../src/utils.ts"
import { assertEquals } from "../deps.ts"
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
      const s27 = jsonSerialize(val27)
      const s28 = jsonSerialize(val28)
      const s29 = jsonSerialize(val29)

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
      const d27 = jsonDeserialize(s27)
      const d28 = jsonDeserialize(s28)
      const d29 = jsonDeserialize(s29)

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
