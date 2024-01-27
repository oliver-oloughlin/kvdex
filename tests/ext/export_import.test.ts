import { exportData } from "../../ext/export.ts"
import { importData } from "../../ext/import.ts"
import { collection, kvdex, model } from "../../mod.ts"
import { assert, assertEquals } from "../deps.ts"
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

Deno.test({
  name: "ext - export_import",
  sanitizeResources: false,
  fn: async (t) => {
    await t.step("Should successfully export and import data", async () => {
      const kvFilepath = await Deno.makeTempFile({ suffix: ".sqlite3" })
      const dataFilepath = await Deno.makeTempFile()
      const kv = await Deno.openKv(kvFilepath)

      const db = kvdex(kv, {
        c_1: collection(model<typeof val1>()),
        c_2: collection(model<typeof val2>()),
        c_3: collection(model<typeof val3>()),
        c_4: collection(model<typeof val4>()),
        c_5: collection(model<typeof val5>()),
        c_6: collection(model<typeof val6>()),
        c_7: collection(model<typeof val7>()),
        c_8: collection(model<typeof val8>()),
        c_9: collection(model<typeof val9>()),
        c_10: collection(model<typeof val10>()),
        c_11: collection(model<typeof val11>()),
        c_12: collection(model<typeof val12>()),
        c_13: collection(model<typeof val13>()),
        c_14: collection(model<typeof val14>()),
        c_15: collection(model<typeof val15>()),
        c_16: collection(model<typeof val16>()),
        c_17: collection(model<typeof val17>()),
        c_18: collection(model<typeof val18>()),
        c_19: collection(model<typeof val19>()),
        c_20: collection(model<typeof val20>()),
        c_21: collection(model<typeof val21>()),
        c_22: collection(model<typeof val22>()),
        c_23: collection(model<typeof val23>()),
        c_24: collection(model<typeof val24>()),
        c_25: collection(model<typeof val25>()),
        c_26: collection(model<typeof val26>()),
        c_27: collection(model<typeof val27>()),
        c_28: collection(model<typeof val28>()),
        c_29: collection(model<typeof val29>()),
        s_1: collection(model<typeof val1>(), { serialize: "json" }),
        s_2: collection(model<typeof val2>(), { serialize: "json" }),
        s_3: collection(model<typeof val3>(), { serialize: "json" }),
        s_4: collection(model<typeof val4>(), { serialize: "json" }),
        s_5: collection(model<typeof val5>(), { serialize: "json" }),
        s_6: collection(model<typeof val6>(), { serialize: "json" }),
        s_7: collection(model<typeof val7>(), { serialize: "json" }),
        s_8: collection(model<typeof val8>(), { serialize: "json" }),
        s_9: collection(model<typeof val9>(), { serialize: "json" }),
        s_10: collection(model<typeof val10>(), { serialize: "json" }),
        s_11: collection(model<typeof val11>(), { serialize: "json" }),
        s_12: collection(model<typeof val12>(), { serialize: "json" }),
        s_13: collection(model<typeof val13>(), { serialize: "json" }),
        s_14: collection(model<typeof val14>(), { serialize: "json" }),
        s_15: collection(model<typeof val15>(), { serialize: "json" }),
        s_16: collection(model<typeof val16>(), { serialize: "json" }),
        s_17: collection(model<typeof val17>(), { serialize: "json" }),
        s_18: collection(model<typeof val18>(), { serialize: "json" }),
        s_19: collection(model<typeof val19>(), { serialize: "json" }),
        s_20: collection(model<typeof val20>(), { serialize: "json" }),
        s_21: collection(model<typeof val21>(), { serialize: "json" }),
        s_22: collection(model<typeof val22>(), { serialize: "json" }),
        s_23: collection(model<typeof val23>(), { serialize: "json" }),
        s_24: collection(model<typeof val24>(), { serialize: "json" }),
        s_25: collection(model<typeof val25>(), { serialize: "json" }),
        s_26: collection(model<typeof val26>(), { serialize: "json" }),
        s_27: collection(model<typeof val27>(), { serialize: "json" }),
        s_28: collection(model<typeof val28>(), { serialize: "json" }),
        s_29: collection(model<typeof val29>(), { serialize: "json" }),
        i: collection(model<typeof val27>(), {
          indices: { val6: "primary", val7: "secondary" },
        }),
        is: collection(model<typeof val27>(), {
          indices: { val6: "primary", val5: "secondary" },
          serialize: "json",
        }),
      })

      const r_c_1 = await db.c_1.add(val1)
      const r_c_2 = await db.c_2.add(val2)
      const r_c_3 = await db.c_3.add(val3)
      const r_c_4 = await db.c_4.add(val4)
      const r_c_5 = await db.c_5.add(val5)
      const r_c_6 = await db.c_6.add(val6)
      const r_c_7 = await db.c_7.add(val7)
      const r_c_8 = await db.c_8.add(val8)
      const r_c_9 = await db.c_9.add(val9)
      const r_c_10 = await db.c_10.add(val10)
      const r_c_11 = await db.c_11.add(val11)
      const r_c_12 = await db.c_12.add(val12)
      const r_c_13 = await db.c_13.add(val13)
      const r_c_14 = await db.c_14.add(val14)
      const r_c_15 = await db.c_15.add(val15)
      const r_c_16 = await db.c_16.add(val16)
      const r_c_17 = await db.c_17.add(val17)
      const r_c_18 = await db.c_18.add(val18)
      const r_c_19 = await db.c_19.add(val19)
      const r_c_20 = await db.c_20.add(val20)
      const r_c_21 = await db.c_21.add(val21)
      const r_c_22 = await db.c_22.add(val22)
      const r_c_23 = await db.c_23.add(val23)
      const r_c_24 = await db.c_24.add(val24)
      const r_c_25 = await db.c_25.add(val25)
      const r_c_26 = await db.c_26.add(val26)
      const r_c_27 = await db.c_27.add(val27)
      const r_c_28 = await db.c_28.add(val28)
      const r_c_29 = await db.c_29.add(val29)
      const r_s_1 = await db.s_1.add(val1)
      const r_s_2 = await db.s_2.add(val2)
      const r_s_3 = await db.s_3.add(val3)
      const r_s_4 = await db.s_4.add(val4)
      const r_s_5 = await db.s_5.add(val5)
      const r_s_6 = await db.s_6.add(val6)
      const r_s_7 = await db.s_7.add(val7)
      const r_s_8 = await db.s_8.add(val8)
      const r_s_9 = await db.s_9.add(val9)
      const r_s_10 = await db.s_10.add(val10)
      const r_s_11 = await db.s_11.add(val11)
      const r_s_12 = await db.s_12.add(val12)
      const r_s_13 = await db.s_13.add(val13)
      const r_s_14 = await db.s_14.add(val14)
      const r_s_15 = await db.s_15.add(val15)
      const r_s_16 = await db.s_16.add(val16)
      const r_s_17 = await db.s_17.add(val17)
      const r_s_18 = await db.s_18.add(val18)
      const r_s_19 = await db.s_19.add(val19)
      const r_s_20 = await db.s_20.add(val20)
      const r_s_21 = await db.s_21.add(val21)
      const r_s_22 = await db.s_22.add(val22)
      const r_s_23 = await db.s_23.add(val23)
      const r_s_24 = await db.s_24.add(val24)
      const r_s_25 = await db.s_25.add(val25)
      const r_s_26 = await db.s_26.add(val26)
      const r_s_27 = await db.s_27.add(val27)
      const r_s_28 = await db.s_28.add(val28)
      const r_s_29 = await db.s_29.add(val29)
      const r_i = await db.i.add(val27)
      const r_is = await db.is.add(val27)

      assert(r_c_1.ok)
      assert(r_c_2.ok)
      assert(r_c_3.ok)
      assert(r_c_4.ok)
      assert(r_c_5.ok)
      assert(r_c_6.ok)
      assert(r_c_7.ok)
      assert(r_c_8.ok)
      assert(r_c_9.ok)
      assert(r_c_10.ok)
      assert(r_c_11.ok)
      assert(r_c_12.ok)
      assert(r_c_13.ok)
      assert(r_c_14.ok)
      assert(r_c_15.ok)
      assert(r_c_16.ok)
      assert(r_c_17.ok)
      assert(r_c_18.ok)
      assert(r_c_19.ok)
      assert(r_c_20.ok)
      assert(r_c_21.ok)
      assert(r_c_22.ok)
      assert(r_c_23.ok)
      assert(r_c_24.ok)
      assert(r_c_25.ok)
      assert(r_c_26.ok)
      assert(r_c_27.ok)
      assert(r_c_28.ok)
      assert(r_c_29.ok)
      assert(r_s_1.ok)
      assert(r_s_2.ok)
      assert(r_s_3.ok)
      assert(r_s_4.ok)
      assert(r_s_5.ok)
      assert(r_s_6.ok)
      assert(r_s_7.ok)
      assert(r_s_8.ok)
      assert(r_s_9.ok)
      assert(r_s_10.ok)
      assert(r_s_11.ok)
      assert(r_s_12.ok)
      assert(r_s_13.ok)
      assert(r_s_14.ok)
      assert(r_s_15.ok)
      assert(r_s_16.ok)
      assert(r_s_17.ok)
      assert(r_s_18.ok)
      assert(r_s_19.ok)
      assert(r_s_20.ok)
      assert(r_s_21.ok)
      assert(r_s_22.ok)
      assert(r_s_23.ok)
      assert(r_s_24.ok)
      assert(r_s_25.ok)
      assert(r_s_26.ok)
      assert(r_s_27.ok)
      assert(r_s_28.ok)
      assert(r_s_29.ok)
      assert(r_i.ok)
      assert(r_is.ok)

      const count_1 = await db.countAll()
      assert(count_1 === 2 * 29 + 2)

      await exportData(dataFilepath, kvFilepath)
      await db.wipe()

      const count_2 = await db.countAll()
      assert(count_2 === 0)

      await importData(dataFilepath, kvFilepath)

      const count_3 = await db.countAll()
      assert(count_3 === 2 * 29 + 2)

      const d_c_1 = await db.c_1.find(r_c_1.id)
      const d_c_2 = await db.c_2.find(r_c_2.id)
      const d_c_3 = await db.c_3.find(r_c_3.id)
      const d_c_4 = await db.c_4.find(r_c_4.id)
      const d_c_5 = await db.c_5.find(r_c_5.id)
      const d_c_6 = await db.c_6.find(r_c_6.id)
      const d_c_7 = await db.c_7.find(r_c_7.id)
      const d_c_8 = await db.c_8.find(r_c_8.id)
      const d_c_9 = await db.c_9.find(r_c_9.id)
      const d_c_10 = await db.c_10.find(r_c_10.id)
      const d_c_11 = await db.c_11.find(r_c_11.id)
      const d_c_12 = await db.c_12.find(r_c_12.id)
      const d_c_13 = await db.c_13.find(r_c_13.id)
      const d_c_14 = await db.c_14.find(r_c_14.id)
      const d_c_15 = await db.c_15.find(r_c_15.id)
      const d_c_16 = await db.c_16.find(r_c_16.id)
      const d_c_17 = await db.c_17.find(r_c_17.id)
      const d_c_18 = await db.c_18.find(r_c_18.id)
      const d_c_19 = await db.c_19.find(r_c_19.id)
      const d_c_20 = await db.c_20.find(r_c_20.id)
      const d_c_21 = await db.c_21.find(r_c_21.id)
      const d_c_22 = await db.c_22.find(r_c_22.id)
      const d_c_23 = await db.c_23.find(r_c_23.id)
      const d_c_24 = await db.c_24.find(r_c_24.id)
      const d_c_25 = await db.c_25.find(r_c_25.id)
      const d_c_26 = await db.c_26.find(r_c_26.id)
      const d_c_27 = await db.c_27.find(r_c_27.id)
      const d_c_28 = await db.c_28.find(r_c_28.id)
      const d_c_29 = await db.c_29.find(r_c_29.id)
      const d_s_1 = await db.s_1.find(r_s_1.id)
      const d_s_2 = await db.s_2.find(r_s_2.id)
      const d_s_3 = await db.s_3.find(r_s_3.id)
      const d_s_4 = await db.s_4.find(r_s_4.id)
      const d_s_5 = await db.s_5.find(r_s_5.id)
      const d_s_6 = await db.s_6.find(r_s_6.id)
      const d_s_7 = await db.s_7.find(r_s_7.id)
      const d_s_8 = await db.s_8.find(r_s_8.id)
      const d_s_9 = await db.s_9.find(r_s_9.id)
      const d_s_10 = await db.s_10.find(r_s_10.id)
      const d_s_11 = await db.s_11.find(r_s_11.id)
      const d_s_12 = await db.s_12.find(r_s_12.id)
      const d_s_13 = await db.s_13.find(r_s_13.id)
      const d_s_14 = await db.s_14.find(r_s_14.id)
      const d_s_15 = await db.s_15.find(r_s_15.id)
      const d_s_16 = await db.s_16.find(r_s_16.id)
      const d_s_17 = await db.s_17.find(r_s_17.id)
      const d_s_18 = await db.s_18.find(r_s_18.id)
      const d_s_19 = await db.s_19.find(r_s_19.id)
      const d_s_20 = await db.s_20.find(r_s_20.id)
      const d_s_21 = await db.s_21.find(r_s_21.id)
      const d_s_22 = await db.s_22.find(r_s_22.id)
      const d_s_23 = await db.s_23.find(r_s_23.id)
      const d_s_24 = await db.s_24.find(r_s_24.id)
      const d_s_25 = await db.s_25.find(r_s_25.id)
      const d_s_26 = await db.s_26.find(r_s_26.id)
      const d_s_27 = await db.s_27.find(r_s_27.id)
      const d_s_28 = await db.s_28.find(r_s_28.id)
      const d_s_29 = await db.s_29.find(r_s_29.id)
      const d_i = await db.i.find(r_i.id)
      const d_is = await db.is.find(r_is.id)

      assertEquals(d_c_1?.value, val1)
      assertEquals(d_c_2?.value, val2)
      assertEquals(d_c_3?.value, val3)
      assertEquals(d_c_4?.value, val4)
      assertEquals(d_c_5?.value, val5)
      assertEquals(d_c_6?.value, val6)
      assertEquals(d_c_7?.value, val7)
      assertEquals(d_c_8?.value, val8)
      assertEquals(d_c_9?.value, val9)
      assertEquals(d_c_10?.value, val10)
      assertEquals(d_c_11?.value, val11)
      assertEquals(d_c_12?.value, val12)
      assertEquals(d_c_13?.value, val13)
      assertEquals(d_c_14?.value, val14)
      assertEquals(d_c_15?.value, val15)
      assertEquals(d_c_16?.value, val16)
      assertEquals(d_c_17?.value, val17)
      assertEquals(d_c_18?.value, val18)
      assertEquals(d_c_19?.value, val19)
      assertEquals(d_c_20?.value, val20)
      assertEquals(d_c_21?.value, val21)
      assertEquals(d_c_22?.value, val22)
      assertEquals(d_c_23?.value, val23)
      assertEquals(d_c_24?.value, val24)
      assertEquals(d_c_25?.value, val25)
      assertEquals(d_c_26?.value, val26)
      assertEquals(d_c_27?.value, val27)
      assertEquals(d_c_28?.value, val28)
      assertEquals(d_c_29?.value, val29)
      assertEquals(d_s_1?.value, val1)
      assertEquals(d_s_2?.value, val2)
      assertEquals(d_s_3?.value, val3)
      assertEquals(d_s_4?.value, val4)
      assertEquals(d_s_5?.value, val5)
      assertEquals(d_s_6?.value, val6)
      assertEquals(d_s_7?.value, val7)
      assertEquals(d_s_8?.value, val8)
      assertEquals(d_s_9?.value, val9)
      assertEquals(d_s_10?.value, val10)
      assertEquals(d_s_11?.value, val11)
      assertEquals(d_s_12?.value, val12)
      assertEquals(d_s_13?.value, val13)
      assertEquals(d_s_14?.value, val14)
      assertEquals(d_s_15?.value, val15)
      assertEquals(d_s_16?.value, val16)
      assertEquals(d_s_17?.value, val17)
      assertEquals(d_s_18?.value, val18)
      assertEquals(d_s_19?.value, val19)
      assertEquals(d_s_20?.value, val20)
      assertEquals(d_s_21?.value, val21)
      assertEquals(d_s_22?.value, val22)
      assertEquals(d_s_23?.value, val23)
      assertEquals(d_s_24?.value, val24)
      assertEquals(d_s_25?.value, val25)
      assertEquals(d_s_26?.value, val26)
      assertEquals(d_s_27?.value, val27)
      assertEquals(d_s_28?.value, val28)
      assertEquals(d_s_29?.value, val29)
      assertEquals(d_i?.value, val27)
      assertEquals(d_is?.value, val27)

      kv.close()
      await Deno.remove(kvFilepath)
      await Deno.remove(dataFilepath)
    })
  },
})
