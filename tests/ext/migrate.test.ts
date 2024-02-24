import { migrate } from "../../ext/migrate.ts"
import { collection } from "../../src/collection.ts"
import { kvdex } from "../../src/kvdex.ts"
import { model } from "../../src/model.ts"
import { assert, assertEquals } from "../test.deps.ts"
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

function createDb(kv: Deno.Kv) {
  return kvdex(kv, {
    c1: collection(model<typeof val1>()),
    c2: collection(model<typeof val2>()),
    c3: collection(model<typeof val3>()),
    c4: collection(model<typeof val4>()),
    c5: collection(model<typeof val5>()),
    c6: collection(model<typeof val6>()),
    c7: collection(model<typeof val7>()),
    c8: collection(model<typeof val8>()),
    c9: collection(model<typeof val9>()),
    c10: collection(model<typeof val10>()),
    c11: collection(model<typeof val11>()),
    c12: collection(model<typeof val12>()),
    c13: collection(model<typeof val13>()),
    c14: collection(model<typeof val14>()),
    c15: collection(model<typeof val15>()),
    c16: collection(model<typeof val16>()),
    c17: collection(model<typeof val17>()),
    c18: collection(model<typeof val18>()),
    c19: collection(model<typeof val19>()),
    c20: collection(model<typeof val20>()),
    c21: collection(model<typeof val21>()),
    c22: collection(model<typeof val22>()),
    c23: collection(model<typeof val23>()),
    c24: collection(model<typeof val24>()),
    c25: collection(model<typeof val25>()),
    c26: collection(model<typeof val26>()),
    c27: collection(model<typeof val27>()),
    c28: collection(model<typeof val28>()),
    c29: collection(model<typeof val29>()),
    s1: collection(model<typeof val1>(), { serialize: "json" }),
    s2: collection(model<typeof val2>(), { serialize: "json" }),
    s3: collection(model<typeof val3>(), { serialize: "json" }),
    s4: collection(model<typeof val4>(), { serialize: "json" }),
    s5: collection(model<typeof val5>(), { serialize: "json" }),
    s6: collection(model<typeof val6>(), { serialize: "json" }),
    s7: collection(model<typeof val7>(), { serialize: "json" }),
    s8: collection(model<typeof val8>(), { serialize: "json" }),
    s9: collection(model<typeof val9>(), { serialize: "json" }),
    s10: collection(model<typeof val10>(), { serialize: "json" }),
    s11: collection(model<typeof val11>(), { serialize: "json" }),
    s12: collection(model<typeof val12>(), { serialize: "json" }),
    s13: collection(model<typeof val13>(), { serialize: "json" }),
    s14: collection(model<typeof val14>(), { serialize: "json" }),
    s15: collection(model<typeof val15>(), { serialize: "json" }),
    s16: collection(model<typeof val16>(), { serialize: "json" }),
    s17: collection(model<typeof val17>(), { serialize: "json" }),
    s18: collection(model<typeof val18>(), { serialize: "json" }),
    s19: collection(model<typeof val19>(), { serialize: "json" }),
    s20: collection(model<typeof val20>(), { serialize: "json" }),
    s21: collection(model<typeof val21>(), { serialize: "json" }),
    s22: collection(model<typeof val22>(), { serialize: "json" }),
    s23: collection(model<typeof val23>(), { serialize: "json" }),
    s24: collection(model<typeof val24>(), { serialize: "json" }),
    s25: collection(model<typeof val25>(), { serialize: "json" }),
    s26: collection(model<typeof val26>(), { serialize: "json" }),
    s27: collection(model<typeof val27>(), { serialize: "json" }),
    s28: collection(model<typeof val28>(), { serialize: "json" }),
    s29: collection(model<typeof val29>(), { serialize: "json" }),
    i: collection(model<typeof val27>(), {
      indices: { val5: "primary", val6: "secondary" },
    }),
    is: collection(model<typeof val27>(), {
      serialize: "json",
      indices: { val5: "primary", val6: "secondary" },
    }),
  })
}

Deno.test("ext - migrate", async (t) => {
  await t.step("Should only migrate kvdex entries", async () => {
    const temp = await Deno.makeTempFile({ suffix: ".sqlite3" })
    using sourceKv = await Deno.openKv(":memory:")
    using targetKv = await Deno.openKv(temp)

    await sourceKv.set(["check"], "check")

    const sourceDb = createDb(sourceKv)

    const c1_cr = await sourceDb.c1.add(val1)
    const c2_cr = await sourceDb.c2.add(val2)
    const c3_cr = await sourceDb.c3.add(val3)
    const c4_cr = await sourceDb.c4.add(val4)
    const c5_cr = await sourceDb.c5.add(val5)
    const c6_cr = await sourceDb.c6.add(val6)
    const c7_cr = await sourceDb.c7.add(val7)
    const c8_cr = await sourceDb.c8.add(val8)
    const c9_cr = await sourceDb.c9.add(val9)
    const c10_cr = await sourceDb.c10.add(val10)
    const c11_cr = await sourceDb.c11.add(val11)
    const c12_cr = await sourceDb.c12.add(val12)
    const c13_cr = await sourceDb.c13.add(val13)
    const c14_cr = await sourceDb.c14.add(val14)
    const c15_cr = await sourceDb.c15.add(val15)
    const c16_cr = await sourceDb.c16.add(val16)
    const c17_cr = await sourceDb.c17.add(val17)
    const c18_cr = await sourceDb.c18.add(val18)
    const c19_cr = await sourceDb.c19.add(val19)
    const c20_cr = await sourceDb.c20.add(val20)
    const c21_cr = await sourceDb.c21.add(val21)
    const c22_cr = await sourceDb.c22.add(val22)
    const c23_cr = await sourceDb.c23.add(val23)
    const c24_cr = await sourceDb.c24.add(val24)
    const c25_cr = await sourceDb.c25.add(val25)
    const c26_cr = await sourceDb.c26.add(val26)
    const c27_cr = await sourceDb.c27.add(val27)
    const c28_cr = await sourceDb.c28.add(val28)
    const c29_cr = await sourceDb.c29.add(val29)
    const s1_cr = await sourceDb.s1.add(val1)
    const s2_cr = await sourceDb.s2.add(val2)
    const s3_cr = await sourceDb.s3.add(val3)
    const s4_cr = await sourceDb.s4.add(val4)
    const s5_cr = await sourceDb.s5.add(val5)
    const s6_cr = await sourceDb.s6.add(val6)
    const s7_cr = await sourceDb.s7.add(val7)
    const s8_cr = await sourceDb.s8.add(val8)
    const s9_cr = await sourceDb.s9.add(val9)
    const s10_cr = await sourceDb.s10.add(val10)
    const s11_cr = await sourceDb.s11.add(val11)
    const s12_cr = await sourceDb.s12.add(val12)
    const s13_cr = await sourceDb.s13.add(val13)
    const s14_cr = await sourceDb.s14.add(val14)
    const s15_cr = await sourceDb.s15.add(val15)
    const s16_cr = await sourceDb.s16.add(val16)
    const s17_cr = await sourceDb.s17.add(val17)
    const s18_cr = await sourceDb.s18.add(val18)
    const s19_cr = await sourceDb.s19.add(val19)
    const s20_cr = await sourceDb.s20.add(val20)
    const s21_cr = await sourceDb.s21.add(val21)
    const s22_cr = await sourceDb.s22.add(val22)
    const s23_cr = await sourceDb.s23.add(val23)
    const s24_cr = await sourceDb.s24.add(val24)
    const s25_cr = await sourceDb.s25.add(val25)
    const s26_cr = await sourceDb.s26.add(val26)
    const s27_cr = await sourceDb.s27.add(val27)
    const s28_cr = await sourceDb.s28.add(val28)
    const s29_cr = await sourceDb.s29.add(val29)
    const i_cr = await sourceDb.i.add(val27)
    const is_cr = await sourceDb.is.add(val27)

    assert(c1_cr.ok)
    assert(c2_cr.ok)
    assert(c3_cr.ok)
    assert(c4_cr.ok)
    assert(c5_cr.ok)
    assert(c6_cr.ok)
    assert(c7_cr.ok)
    assert(c8_cr.ok)
    assert(c9_cr.ok)
    assert(c10_cr.ok)
    assert(c11_cr.ok)
    assert(c12_cr.ok)
    assert(c13_cr.ok)
    assert(c14_cr.ok)
    assert(c15_cr.ok)
    assert(c16_cr.ok)
    assert(c17_cr.ok)
    assert(c18_cr.ok)
    assert(c19_cr.ok)
    assert(c20_cr.ok)
    assert(c21_cr.ok)
    assert(c22_cr.ok)
    assert(c23_cr.ok)
    assert(c24_cr.ok)
    assert(c25_cr.ok)
    assert(c26_cr.ok)
    assert(c27_cr.ok)
    assert(c28_cr.ok)
    assert(c29_cr.ok)
    assert(s1_cr.ok)
    assert(s2_cr.ok)
    assert(s3_cr.ok)
    assert(s4_cr.ok)
    assert(s5_cr.ok)
    assert(s6_cr.ok)
    assert(s7_cr.ok)
    assert(s8_cr.ok)
    assert(s9_cr.ok)
    assert(s10_cr.ok)
    assert(s11_cr.ok)
    assert(s12_cr.ok)
    assert(s13_cr.ok)
    assert(s14_cr.ok)
    assert(s15_cr.ok)
    assert(s16_cr.ok)
    assert(s17_cr.ok)
    assert(s18_cr.ok)
    assert(s19_cr.ok)
    assert(s20_cr.ok)
    assert(s21_cr.ok)
    assert(s22_cr.ok)
    assert(s23_cr.ok)
    assert(s24_cr.ok)
    assert(s25_cr.ok)
    assert(s26_cr.ok)
    assert(s27_cr.ok)
    assert(s28_cr.ok)
    assert(s29_cr.ok)
    assert(i_cr.ok)
    assert(is_cr.ok)

    await migrate({
      source: sourceKv,
      target: targetKv,
    })

    const targetDb = createDb(targetKv)

    const c1_doc = await targetDb.c1.find(c1_cr.id)
    const c2_doc = await targetDb.c2.find(c2_cr.id)
    const c3_doc = await targetDb.c3.find(c3_cr.id)
    const c4_doc = await targetDb.c4.find(c4_cr.id)
    const c5_doc = await targetDb.c5.find(c5_cr.id)
    const c6_doc = await targetDb.c6.find(c6_cr.id)
    const c7_doc = await targetDb.c7.find(c7_cr.id)
    const c8_doc = await targetDb.c8.find(c8_cr.id)
    const c9_doc = await targetDb.c9.find(c9_cr.id)
    const c10_doc = await targetDb.c10.find(c10_cr.id)
    const c11_doc = await targetDb.c11.find(c11_cr.id)
    const c12_doc = await targetDb.c12.find(c12_cr.id)
    const c13_doc = await targetDb.c13.find(c13_cr.id)
    const c14_doc = await targetDb.c14.find(c14_cr.id)
    const c15_doc = await targetDb.c15.find(c15_cr.id)
    const c16_doc = await targetDb.c16.find(c16_cr.id)
    const c17_doc = await targetDb.c17.find(c17_cr.id)
    const c18_doc = await targetDb.c18.find(c18_cr.id)
    const c19_doc = await targetDb.c19.find(c19_cr.id)
    const c20_doc = await targetDb.c20.find(c20_cr.id)
    const c21_doc = await targetDb.c21.find(c21_cr.id)
    const c22_doc = await targetDb.c22.find(c22_cr.id)
    const c23_doc = await targetDb.c23.find(c23_cr.id)
    const c24_doc = await targetDb.c24.find(c24_cr.id)
    const c25_doc = await targetDb.c25.find(c25_cr.id)
    //const c26_doc = await targetDb.c26.find(c26_cr.id)
    //const c27_doc = await targetDb.c27.find(c27_cr.id)
    //const c28_doc = await targetDb.c28.find(c28_cr.id)
    //const c29_doc = await targetDb.c29.find(c29_cr.id)
    const s1_doc = await targetDb.s1.find(s1_cr.id)
    const s2_doc = await targetDb.s2.find(s2_cr.id)
    const s3_doc = await targetDb.s3.find(s3_cr.id)
    const s4_doc = await targetDb.s4.find(s4_cr.id)
    const s5_doc = await targetDb.s5.find(s5_cr.id)
    const s6_doc = await targetDb.s6.find(s6_cr.id)
    const s7_doc = await targetDb.s7.find(s7_cr.id)
    const s8_doc = await targetDb.s8.find(s8_cr.id)
    const s9_doc = await targetDb.s9.find(s9_cr.id)
    const s10_doc = await targetDb.s10.find(s10_cr.id)
    const s11_doc = await targetDb.s11.find(s11_cr.id)
    const s12_doc = await targetDb.s12.find(s12_cr.id)
    const s13_doc = await targetDb.s13.find(s13_cr.id)
    const s14_doc = await targetDb.s14.find(s14_cr.id)
    const s15_doc = await targetDb.s15.find(s15_cr.id)
    const s16_doc = await targetDb.s16.find(s16_cr.id)
    const s17_doc = await targetDb.s17.find(s17_cr.id)
    const s18_doc = await targetDb.s18.find(s18_cr.id)
    const s19_doc = await targetDb.s19.find(s19_cr.id)
    const s20_doc = await targetDb.s20.find(s20_cr.id)
    const s21_doc = await targetDb.s21.find(s21_cr.id)
    const s22_doc = await targetDb.s22.find(s22_cr.id)
    const s23_doc = await targetDb.s23.find(s23_cr.id)
    const s24_doc = await targetDb.s24.find(s24_cr.id)
    const s25_doc = await targetDb.s25.find(s25_cr.id)
    const s26_doc = await targetDb.s26.find(s26_cr.id)
    const s27_doc = await targetDb.s27.find(s27_cr.id)
    const s28_doc = await targetDb.s28.find(s28_cr.id)
    const s29_doc = await targetDb.s29.find(s29_cr.id)
    //const i_doc = await targetDb.i.find(i_cr.id)
    const is_doc = await targetDb.is.find(is_cr.id)
    const check = await targetKv.get(["check"])

    assertEquals(c1_doc?.value, val1)
    assertEquals(c2_doc?.value, val2)
    assertEquals(c3_doc?.value, val3)
    assertEquals(c4_doc?.value, val4)
    assertEquals(c5_doc?.value, val5)
    assertEquals(c6_doc?.value, val6)
    assertEquals(c7_doc?.value, val7)
    assertEquals(c8_doc?.value, val8)
    assertEquals(c9_doc?.value, val9)
    assertEquals(c10_doc?.value, val10)
    assertEquals(c11_doc?.value, val11)
    assertEquals(c12_doc?.value, val12)
    assertEquals(c13_doc?.value, val13)
    assertEquals(c14_doc?.value, val14)
    assertEquals(c15_doc?.value, val15)
    assertEquals(c16_doc?.value, val16)
    assertEquals(c17_doc?.value, val17)
    assertEquals(c18_doc?.value, val18)
    assertEquals(c19_doc?.value, val19)
    assertEquals(c20_doc?.value, val20)
    assertEquals(c21_doc?.value, val21)
    assertEquals(c22_doc?.value, val22)
    assertEquals(c23_doc?.value, val23)
    assertEquals(c24_doc?.value, val24)
    assertEquals(c25_doc?.value, val25)
    // until nested Deno.KvU64 is fixed // assertEquals(c26_doc?.value, val26)
    // until nested Deno.KvU64 is fixed // assertEquals(c27_doc?.value, val27)
    // until nested Deno.KvU64 is fixed // assertEquals(c28_doc?.value, val28)
    // until nested Deno.KvU64 is fixed // assertEquals(c29_doc?.value, val29)
    assertEquals(s1_doc?.value, val1)
    assertEquals(s2_doc?.value, val2)
    assertEquals(s3_doc?.value, val3)
    assertEquals(s4_doc?.value, val4)
    assertEquals(s5_doc?.value, val5)
    assertEquals(s6_doc?.value, val6)
    assertEquals(s7_doc?.value, val7)
    assertEquals(s8_doc?.value, val8)
    assertEquals(s9_doc?.value, val9)
    assertEquals(s10_doc?.value, val10)
    assertEquals(s11_doc?.value, val11)
    assertEquals(s12_doc?.value, val12)
    assertEquals(s13_doc?.value, val13)
    assertEquals(s14_doc?.value, val14)
    assertEquals(s15_doc?.value, val15)
    assertEquals(s16_doc?.value, val16)
    assertEquals(s17_doc?.value, val17)
    assertEquals(s18_doc?.value, val18)
    assertEquals(s19_doc?.value, val19)
    assertEquals(s20_doc?.value, val20)
    assertEquals(s21_doc?.value, val21)
    assertEquals(s22_doc?.value, val22)
    assertEquals(s23_doc?.value, val23)
    assertEquals(s24_doc?.value, val24)
    assertEquals(s25_doc?.value, val25)
    assertEquals(s26_doc?.value, val26)
    assertEquals(s27_doc?.value, val27)
    assertEquals(s28_doc?.value, val28)
    assertEquals(s29_doc?.value, val29)
    // until nested Deno.KvU64 is fixed // assertEquals(i_doc?.value, val27)
    assertEquals(is_doc?.value, val27)
    assert(!check.versionstamp && !check.value)

    sourceKv.close()
    targetKv.close()

    await Deno.remove(temp)
  })

  await t.step("Should migrate all entries", async () => {
    const temp = await Deno.makeTempFile({ suffix: ".sqlite3" })
    using sourceKv = await Deno.openKv(":memory:")
    using targetKv = await Deno.openKv(temp)

    await sourceKv.set(["check"], "check")

    const sourceDb = createDb(sourceKv)

    const c1_cr = await sourceDb.c1.add(val1)
    const c2_cr = await sourceDb.c2.add(val2)
    const c3_cr = await sourceDb.c3.add(val3)
    const c4_cr = await sourceDb.c4.add(val4)
    const c5_cr = await sourceDb.c5.add(val5)
    const c6_cr = await sourceDb.c6.add(val6)
    const c7_cr = await sourceDb.c7.add(val7)
    const c8_cr = await sourceDb.c8.add(val8)
    const c9_cr = await sourceDb.c9.add(val9)
    const c10_cr = await sourceDb.c10.add(val10)
    const c11_cr = await sourceDb.c11.add(val11)
    const c12_cr = await sourceDb.c12.add(val12)
    const c13_cr = await sourceDb.c13.add(val13)
    const c14_cr = await sourceDb.c14.add(val14)
    const c15_cr = await sourceDb.c15.add(val15)
    const c16_cr = await sourceDb.c16.add(val16)
    const c17_cr = await sourceDb.c17.add(val17)
    const c18_cr = await sourceDb.c18.add(val18)
    const c19_cr = await sourceDb.c19.add(val19)
    const c20_cr = await sourceDb.c20.add(val20)
    const c21_cr = await sourceDb.c21.add(val21)
    const c22_cr = await sourceDb.c22.add(val22)
    const c23_cr = await sourceDb.c23.add(val23)
    const c24_cr = await sourceDb.c24.add(val24)
    const c25_cr = await sourceDb.c25.add(val25)
    const c26_cr = await sourceDb.c26.add(val26)
    const c27_cr = await sourceDb.c27.add(val27)
    const c28_cr = await sourceDb.c28.add(val28)
    const c29_cr = await sourceDb.c29.add(val29)
    const s1_cr = await sourceDb.s1.add(val1)
    const s2_cr = await sourceDb.s2.add(val2)
    const s3_cr = await sourceDb.s3.add(val3)
    const s4_cr = await sourceDb.s4.add(val4)
    const s5_cr = await sourceDb.s5.add(val5)
    const s6_cr = await sourceDb.s6.add(val6)
    const s7_cr = await sourceDb.s7.add(val7)
    const s8_cr = await sourceDb.s8.add(val8)
    const s9_cr = await sourceDb.s9.add(val9)
    const s10_cr = await sourceDb.s10.add(val10)
    const s11_cr = await sourceDb.s11.add(val11)
    const s12_cr = await sourceDb.s12.add(val12)
    const s13_cr = await sourceDb.s13.add(val13)
    const s14_cr = await sourceDb.s14.add(val14)
    const s15_cr = await sourceDb.s15.add(val15)
    const s16_cr = await sourceDb.s16.add(val16)
    const s17_cr = await sourceDb.s17.add(val17)
    const s18_cr = await sourceDb.s18.add(val18)
    const s19_cr = await sourceDb.s19.add(val19)
    const s20_cr = await sourceDb.s20.add(val20)
    const s21_cr = await sourceDb.s21.add(val21)
    const s22_cr = await sourceDb.s22.add(val22)
    const s23_cr = await sourceDb.s23.add(val23)
    const s24_cr = await sourceDb.s24.add(val24)
    const s25_cr = await sourceDb.s25.add(val25)
    const s26_cr = await sourceDb.s26.add(val26)
    const s27_cr = await sourceDb.s27.add(val27)
    const s28_cr = await sourceDb.s28.add(val28)
    const s29_cr = await sourceDb.s29.add(val29)
    const i_cr = await sourceDb.i.add(val27)
    const is_cr = await sourceDb.is.add(val27)

    assert(c1_cr.ok)
    assert(c2_cr.ok)
    assert(c3_cr.ok)
    assert(c4_cr.ok)
    assert(c5_cr.ok)
    assert(c6_cr.ok)
    assert(c7_cr.ok)
    assert(c8_cr.ok)
    assert(c9_cr.ok)
    assert(c10_cr.ok)
    assert(c11_cr.ok)
    assert(c12_cr.ok)
    assert(c13_cr.ok)
    assert(c14_cr.ok)
    assert(c15_cr.ok)
    assert(c16_cr.ok)
    assert(c17_cr.ok)
    assert(c18_cr.ok)
    assert(c19_cr.ok)
    assert(c20_cr.ok)
    assert(c21_cr.ok)
    assert(c22_cr.ok)
    assert(c23_cr.ok)
    assert(c24_cr.ok)
    assert(c25_cr.ok)
    assert(c26_cr.ok)
    assert(c27_cr.ok)
    assert(c28_cr.ok)
    assert(c29_cr.ok)
    assert(s1_cr.ok)
    assert(s2_cr.ok)
    assert(s3_cr.ok)
    assert(s4_cr.ok)
    assert(s5_cr.ok)
    assert(s6_cr.ok)
    assert(s7_cr.ok)
    assert(s8_cr.ok)
    assert(s9_cr.ok)
    assert(s10_cr.ok)
    assert(s11_cr.ok)
    assert(s12_cr.ok)
    assert(s13_cr.ok)
    assert(s14_cr.ok)
    assert(s15_cr.ok)
    assert(s16_cr.ok)
    assert(s17_cr.ok)
    assert(s18_cr.ok)
    assert(s19_cr.ok)
    assert(s20_cr.ok)
    assert(s21_cr.ok)
    assert(s22_cr.ok)
    assert(s23_cr.ok)
    assert(s24_cr.ok)
    assert(s25_cr.ok)
    assert(s26_cr.ok)
    assert(s27_cr.ok)
    assert(s28_cr.ok)
    assert(s29_cr.ok)
    assert(i_cr.ok)
    assert(is_cr.ok)

    await migrate({
      source: sourceKv,
      target: targetKv,
      all: true,
    })

    const targetDb = createDb(targetKv)

    const c1_doc = await targetDb.c1.find(c1_cr.id)
    const c2_doc = await targetDb.c2.find(c2_cr.id)
    const c3_doc = await targetDb.c3.find(c3_cr.id)
    const c4_doc = await targetDb.c4.find(c4_cr.id)
    const c5_doc = await targetDb.c5.find(c5_cr.id)
    const c6_doc = await targetDb.c6.find(c6_cr.id)
    const c7_doc = await targetDb.c7.find(c7_cr.id)
    const c8_doc = await targetDb.c8.find(c8_cr.id)
    const c9_doc = await targetDb.c9.find(c9_cr.id)
    const c10_doc = await targetDb.c10.find(c10_cr.id)
    const c11_doc = await targetDb.c11.find(c11_cr.id)
    const c12_doc = await targetDb.c12.find(c12_cr.id)
    const c13_doc = await targetDb.c13.find(c13_cr.id)
    const c14_doc = await targetDb.c14.find(c14_cr.id)
    const c15_doc = await targetDb.c15.find(c15_cr.id)
    const c16_doc = await targetDb.c16.find(c16_cr.id)
    const c17_doc = await targetDb.c17.find(c17_cr.id)
    const c18_doc = await targetDb.c18.find(c18_cr.id)
    const c19_doc = await targetDb.c19.find(c19_cr.id)
    const c20_doc = await targetDb.c20.find(c20_cr.id)
    const c21_doc = await targetDb.c21.find(c21_cr.id)
    const c22_doc = await targetDb.c22.find(c22_cr.id)
    const c23_doc = await targetDb.c23.find(c23_cr.id)
    const c24_doc = await targetDb.c24.find(c24_cr.id)
    const c25_doc = await targetDb.c25.find(c25_cr.id)
    //const c26_doc = await targetDb.c26.find(c26_cr.id)
    //const c27_doc = await targetDb.c27.find(c27_cr.id)
    //const c28_doc = await targetDb.c28.find(c28_cr.id)
    //const c29_doc = await targetDb.c29.find(c29_cr.id)
    const s1_doc = await targetDb.s1.find(s1_cr.id)
    const s2_doc = await targetDb.s2.find(s2_cr.id)
    const s3_doc = await targetDb.s3.find(s3_cr.id)
    const s4_doc = await targetDb.s4.find(s4_cr.id)
    const s5_doc = await targetDb.s5.find(s5_cr.id)
    const s6_doc = await targetDb.s6.find(s6_cr.id)
    const s7_doc = await targetDb.s7.find(s7_cr.id)
    const s8_doc = await targetDb.s8.find(s8_cr.id)
    const s9_doc = await targetDb.s9.find(s9_cr.id)
    const s10_doc = await targetDb.s10.find(s10_cr.id)
    const s11_doc = await targetDb.s11.find(s11_cr.id)
    const s12_doc = await targetDb.s12.find(s12_cr.id)
    const s13_doc = await targetDb.s13.find(s13_cr.id)
    const s14_doc = await targetDb.s14.find(s14_cr.id)
    const s15_doc = await targetDb.s15.find(s15_cr.id)
    const s16_doc = await targetDb.s16.find(s16_cr.id)
    const s17_doc = await targetDb.s17.find(s17_cr.id)
    const s18_doc = await targetDb.s18.find(s18_cr.id)
    const s19_doc = await targetDb.s19.find(s19_cr.id)
    const s20_doc = await targetDb.s20.find(s20_cr.id)
    const s21_doc = await targetDb.s21.find(s21_cr.id)
    const s22_doc = await targetDb.s22.find(s22_cr.id)
    const s23_doc = await targetDb.s23.find(s23_cr.id)
    const s24_doc = await targetDb.s24.find(s24_cr.id)
    const s25_doc = await targetDb.s25.find(s25_cr.id)
    const s26_doc = await targetDb.s26.find(s26_cr.id)
    const s27_doc = await targetDb.s27.find(s27_cr.id)
    const s28_doc = await targetDb.s28.find(s28_cr.id)
    const s29_doc = await targetDb.s29.find(s29_cr.id)
    //const i_doc = await targetDb.i.find(i_cr.id)
    const is_doc = await targetDb.is.find(is_cr.id)
    const check = await targetKv.get(["check"])

    assertEquals(c1_doc?.value, val1)
    assertEquals(c2_doc?.value, val2)
    assertEquals(c3_doc?.value, val3)
    assertEquals(c4_doc?.value, val4)
    assertEquals(c5_doc?.value, val5)
    assertEquals(c6_doc?.value, val6)
    assertEquals(c7_doc?.value, val7)
    assertEquals(c8_doc?.value, val8)
    assertEquals(c9_doc?.value, val9)
    assertEquals(c10_doc?.value, val10)
    assertEquals(c11_doc?.value, val11)
    assertEquals(c12_doc?.value, val12)
    assertEquals(c13_doc?.value, val13)
    assertEquals(c14_doc?.value, val14)
    assertEquals(c15_doc?.value, val15)
    assertEquals(c16_doc?.value, val16)
    assertEquals(c17_doc?.value, val17)
    assertEquals(c18_doc?.value, val18)
    assertEquals(c19_doc?.value, val19)
    assertEquals(c20_doc?.value, val20)
    assertEquals(c21_doc?.value, val21)
    assertEquals(c22_doc?.value, val22)
    assertEquals(c23_doc?.value, val23)
    assertEquals(c24_doc?.value, val24)
    assertEquals(c25_doc?.value, val25)
    // until nested Deno.KvU64 is fixed // assertEquals(c26_doc?.value, val26)
    // until nested Deno.KvU64 is fixed // assertEquals(c27_doc?.value, val27)
    // until nested Deno.KvU64 is fixed // assertEquals(c28_doc?.value, val28)
    // until nested Deno.KvU64 is fixed // assertEquals(c29_doc?.value, val29)
    assertEquals(s1_doc?.value, val1)
    assertEquals(s2_doc?.value, val2)
    assertEquals(s3_doc?.value, val3)
    assertEquals(s4_doc?.value, val4)
    assertEquals(s5_doc?.value, val5)
    assertEquals(s6_doc?.value, val6)
    assertEquals(s7_doc?.value, val7)
    assertEquals(s8_doc?.value, val8)
    assertEquals(s9_doc?.value, val9)
    assertEquals(s10_doc?.value, val10)
    assertEquals(s11_doc?.value, val11)
    assertEquals(s12_doc?.value, val12)
    assertEquals(s13_doc?.value, val13)
    assertEquals(s14_doc?.value, val14)
    assertEquals(s15_doc?.value, val15)
    assertEquals(s16_doc?.value, val16)
    assertEquals(s17_doc?.value, val17)
    assertEquals(s18_doc?.value, val18)
    assertEquals(s19_doc?.value, val19)
    assertEquals(s20_doc?.value, val20)
    assertEquals(s21_doc?.value, val21)
    assertEquals(s22_doc?.value, val22)
    assertEquals(s23_doc?.value, val23)
    assertEquals(s24_doc?.value, val24)
    assertEquals(s25_doc?.value, val25)
    assertEquals(s26_doc?.value, val26)
    assertEquals(s27_doc?.value, val27)
    assertEquals(s28_doc?.value, val28)
    assertEquals(s29_doc?.value, val29)
    // until nested Deno.KvU64 is fixed // assertEquals(i_doc?.value, val27)
    assertEquals(is_doc?.value, val27)
    assert(!!check.versionstamp && !!check.value)

    sourceKv.close()
    targetKv.close()

    await Deno.remove(temp)
  })
})
