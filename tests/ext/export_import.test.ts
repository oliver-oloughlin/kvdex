import { exportData } from "../../ext/export.ts"
import { importData } from "../../ext/import.ts"
import { collection, kvdex, model } from "../../mod.ts"
import { assert } from "../deps.ts"

Deno.test("ext - export_import", async (t) => {
  await t.step("Should successfully export and import data", async () => {
    const kvFilepath = await Deno.makeTempFile({ suffix: ".sqlite3" })
    const dataFilepath = await Deno.makeTempFile()
    const kv = await Deno.openKv(kvFilepath)

    const v1 = undefined
    const v2 = null
    const v3 = 10
    const v4 = "text"
    const v5 = true
    const v6 = 20n
    const v7 = new Deno.KvU64(30n)
    const v8 = new Int8Array([10, 20, 30])
    const v9 = new Int16Array([10, 20, 30])
    const v10 = new Int32Array([10, 20, 30])
    const v11 = new BigInt64Array([10n, 20n, 30n])
    const v12 = new Uint8Array([10, 20, 30])
    const v13 = new Uint16Array([10, 20, 30])
    const v14 = new Uint32Array([10, 20, 30])
    const v15 = new BigUint64Array([10n, 20n, 30n])
    const v16 = new Uint8ClampedArray([10, 20, 30])
    const v17 = new Float32Array([10, 20, 30])
    const v18 = new Float64Array([10, 20, 30])
    const v19 = new ArrayBuffer(100)
    const v20 = new Date("2024-01-01")
    const v21 = new Set<number>([10, 20, 30])
    const v22 = new Map<string, number>([["10", 10], ["20", 20], ["30", 30]])
    const v23 = /[0-9]/
    const v24 = new Error("error")
    const v25 = new DataView(new ArrayBuffer(100))
    const v26 = [v1,v2,v3,v4,v5,v6,v7,v8,v9,v10,v11,v12,v13,v14,v15,v16,v17,v18,v19,v20,v21,v22,v23,v24,v25]
    const v27 = {v1,v2,v3,v4,v5,v6,v7,v8,v9,v10,v11,v12,v13,v14,v15,v16,v17,v18,v19,v20,v21,v22,v23,v24,v25}

    try {
      const db = kvdex(kv, {
        c_1: collection(model<typeof v1>()),
        c_2: collection(model<typeof v2>()),
        c_3: collection(model<typeof v3>()),
        c_4: collection(model<typeof v4>()),
        c_5: collection(model<typeof v5>()),
        c_6: collection(model<typeof v6>()),
        c_7: collection(model<typeof v7>()),
        c_8: collection(model<typeof v8>()),
        c_9: collection(model<typeof v9>()),
        c_10: collection(model<typeof v10>()),
        c_11: collection(model<typeof v11>()),
        c_12: collection(model<typeof v12>()),
        c_13: collection(model<typeof v13>()),
        c_14: collection(model<typeof v14>()),
        c_15: collection(model<typeof v15>()),
        c_16: collection(model<typeof v16>()),
        c_17: collection(model<typeof v17>()),
        c_18: collection(model<typeof v18>()),
        c_19: collection(model<typeof v19>()),
        c_20: collection(model<typeof v20>()),
        c_21: collection(model<typeof v21>()),
        c_22: collection(model<typeof v22>()),
        c_23: collection(model<typeof v23>()),
        c_24: collection(model<typeof v24>()),
        c_25: collection(model<typeof v25>()),
        c_26: collection(model<typeof v26>()),
        c_27: collection(model<typeof v27>()),
        s_1: collection(model<typeof v1>(), { serialize: "json" }),
        s_2: collection(model<typeof v2>(), { serialize: "json" }),
        s_3: collection(model<typeof v3>(), { serialize: "json" }),
        s_4: collection(model<typeof v4>(), { serialize: "json" }),
        s_5: collection(model<typeof v5>(), { serialize: "json" }),
        s_6: collection(model<typeof v6>(), { serialize: "json" }),
        s_7: collection(model<typeof v7>(), { serialize: "json" }),
        s_8: collection(model<typeof v8>(), { serialize: "json" }),
        s_9: collection(model<typeof v9>(), { serialize: "json" }),
        s_10: collection(model<typeof v10>(), { serialize: "json" }),
        s_11: collection(model<typeof v11>(), { serialize: "json" }),
        s_12: collection(model<typeof v12>(), { serialize: "json" }),
        s_13: collection(model<typeof v13>(), { serialize: "json" }),
        s_14: collection(model<typeof v14>(), { serialize: "json" }),
        s_15: collection(model<typeof v15>(), { serialize: "json" }),
        s_16: collection(model<typeof v16>(), { serialize: "json" }),
        s_17: collection(model<typeof v17>(), { serialize: "json" }),
        s_18: collection(model<typeof v18>(), { serialize: "json" }),
        s_19: collection(model<typeof v19>(), { serialize: "json" }),
        s_20: collection(model<typeof v20>(), { serialize: "json" }),
        s_21: collection(model<typeof v21>(), { serialize: "json" }),
        s_22: collection(model<typeof v22>(), { serialize: "json" }),
        s_23: collection(model<typeof v23>(), { serialize: "json" }),
        s_24: collection(model<typeof v24>(), { serialize: "json" }),
        s_25: collection(model<typeof v25>(), { serialize: "json" }),
        s_26: collection(model<typeof v26>(), { serialize: "json" }),
        s_27: collection(model<typeof v27>(), { serialize: "json" }),
        i: collection(model<typeof v27>(), { indices: {} }),
        is: collection(model<typeof v27>(), { indices: {}, serialize: "json" }),
      })

      const r_c_1 = await db.c_1.add(v1)
      const r_c_2 = await db.c_2.add(v2)
      const r_c_3 = await db.c_3.add(v3)
      const r_c_4 = await db.c_4.add(v4)
      const r_c_5 = await db.c_5.add(v5)
      const r_c_6 = await db.c_6.add(v6)
      const r_c_7 = await db.c_7.add(v7)
      const r_c_8 = await db.c_8.add(v8)
      const r_c_9 = await db.c_9.add(v9)
      const r_c_10 = await db.c_10.add(v10)
      const r_c_11 = await db.c_11.add(v11)
      const r_c_12 = await db.c_12.add(v12)
      const r_c_13 = await db.c_13.add(v13)
      const r_c_14 = await db.c_14.add(v14)
      const r_c_15 = await db.c_15.add(v15)
      const r_c_16 = await db.c_16.add(v16)
      const r_c_17 = await db.c_17.add(v17)
      const r_c_18 = await db.c_18.add(v18)
      const r_c_19 = await db.c_19.add(v19)
      const r_c_20 = await db.c_20.add(v20)
      const r_c_21 = await db.c_21.add(v21)
      const r_c_22 = await db.c_22.add(v22)
      const r_c_23 = await db.c_23.add(v23)
      const r_c_24 = await db.c_24.add(v24)
      const r_c_25 = await db.c_25.add(v25)
      const r_c_26 = await db.c_26.add(v26)
      const r_c_27 = await db.c_27.add(v27)
      const r_s_1 = await db.s_1.add(v1)
      const r_s_2 = await db.s_2.add(v2)
      const r_s_3 = await db.s_3.add(v3)
      const r_s_4 = await db.s_4.add(v4)
      const r_s_5 = await db.s_5.add(v5)
      const r_s_6 = await db.s_6.add(v6)
      const r_s_7 = await db.s_7.add(v7)
      const r_s_8 = await db.s_8.add(v8)
      const r_s_9 = await db.s_9.add(v9)
      const r_s_10 = await db.s_10.add(v10)
      const r_s_11 = await db.s_11.add(v11)
      const r_s_12 = await db.s_12.add(v12)
      const r_s_13 = await db.s_13.add(v13)
      const r_s_14 = await db.s_14.add(v14)
      const r_s_15 = await db.s_15.add(v15)
      const r_s_16 = await db.s_16.add(v16)
      const r_s_17 = await db.s_17.add(v17)
      const r_s_18 = await db.s_18.add(v18)
      const r_s_19 = await db.s_19.add(v19)
      const r_s_20 = await db.s_20.add(v20)
      const r_s_21 = await db.s_21.add(v21)
      const r_s_22 = await db.s_22.add(v22)
      const r_s_23 = await db.s_23.add(v23)
      const r_s_24 = await db.s_24.add(v24)
      const r_s_25 = await db.s_25.add(v25)
      const r_s_26 = await db.s_26.add(v26)
      const r_s_27 = await db.s_27.add(v27)
      const r_i = await db.i.add(v27)
      const r_is = await db.is.add(v27)

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
      assert(r_i.ok)
      assert(r_is.ok)

      const count_1 = await db.countAll()
      assert(count_1 === 2 * 27 + 2)

      await exportData(dataFilepath, kvFilepath)
      await db.wipe()

      const count_2 = await db.countAll()
      assert(count_2 === 0)

      await importData(dataFilepath, kvFilepath)

      const count_3 = await db.countAll()
      assert(count_3 === 2 * 27 + 2)
    } finally {
      kv.close()
      await Deno.remove(kvFilepath)
      await Deno.remove(dataFilepath)
    }
  })
})
