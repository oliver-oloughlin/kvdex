import { migrate } from "../../src/ext/migrate/mod.ts";
import { collection } from "../../src/collection.ts";
import { kvdex } from "../../src/kvdex.ts";
import { model } from "../../src/model.ts";
import { assert, assertEquals } from "../test.deps.ts";
import {
  TArray,
  TBigint,
  TBigInt64Array,
  TBigUint64Array,
  TBoolean,
  TBuffer,
  TDataView,
  TDate,
  TError,
  TFloat32Array,
  TFloat64Array,
  TInfinity,
  TInt16Array,
  TInt32Array,
  TInt8Array,
  TKvU64,
  TMap,
  TNaN,
  TNull,
  TNumber,
  TObject,
  TRegExp,
  TSet,
  TString,
  TUint16Array,
  TUint32Array,
  TUint8Array,
  TUint8ClampedArray,
  TUndefined,
} from "../values.ts";

function createDb(kv: Deno.Kv) {
  return kvdex(kv, {
    c_TUndefined: collection(model<typeof TUndefined>()),
    c_TNull: collection(model<typeof TNull>()),
    c_TNaN: collection(model<typeof TNaN>()),
    c_TInfinity: collection(model<typeof TInfinity>()),
    c_TNumber: collection(model<typeof TNumber>()),
    c_TString: collection(model<typeof TString>()),
    c_TBigint: collection(model<typeof TBigint>()),
    c_TKvU64: collection(model<typeof TKvU64>()),
    c_TBoolean: collection(model<typeof TBoolean>()),
    c_TInt8Array: collection(model<typeof TInt8Array>()),
    c_TInt16Array: collection(model<typeof TInt16Array>()),
    c_TInt32Array: collection(model<typeof TInt32Array>()),
    c_TBigInt64Array: collection(model<typeof TBigInt64Array>()),
    c_TUint8Array: collection(model<typeof TUint8Array>()),
    c_TUint16Array: collection(model<typeof TUint16Array>()),
    c_TUint32Array: collection(model<typeof TUint32Array>()),
    c_TBigUint64Array: collection(model<typeof TBigUint64Array>()),
    c_TUint8ClampedArray: collection(model<typeof TUint8ClampedArray>()),
    c_TFloat32Array: collection(model<typeof TFloat32Array>()),
    c_TFloat64Array: collection(model<typeof TFloat64Array>()),
    c_TBuffer: collection(model<typeof TBuffer>()),
    c_TDataView: collection(model<typeof TDataView>()),
    c_TDate: collection(model<typeof TDate>()),
    c_TError: collection(model<typeof TError>()),
    c_TRegExp: collection(model<typeof TRegExp>()),
    c_TArray: collection(model<typeof TArray>()),
    c_TObject: collection(model<typeof TObject>()),
    c_TSet: collection(model<typeof TSet>()),
    c_TMap: collection(model<typeof TMap>()),
    s_TUndefined: collection(model<typeof TUndefined>()),
    s_TNull: collection(model<typeof TNull>()),
    s_TNaN: collection(model<typeof TNaN>()),
    s_TInfinity: collection(model<typeof TInfinity>()),
    s_TNumber: collection(model<typeof TNumber>()),
    s_TString: collection(model<typeof TString>()),
    s_TBigint: collection(model<typeof TBigint>()),
    s_TKvU64: collection(model<typeof TKvU64>()),
    s_TBoolean: collection(model<typeof TBoolean>()),
    s_TInt8Array: collection(model<typeof TInt8Array>()),
    s_TInt16Array: collection(model<typeof TInt16Array>()),
    s_TInt32Array: collection(model<typeof TInt32Array>()),
    s_TBigInt64Array: collection(model<typeof TBigInt64Array>()),
    s_TUint8Array: collection(model<typeof TUint8Array>()),
    s_TUint16Array: collection(model<typeof TUint16Array>()),
    s_TUint32Array: collection(model<typeof TUint32Array>()),
    s_TBigUint64Array: collection(model<typeof TBigUint64Array>()),
    s_TUint8ClampedArray: collection(model<typeof TUint8ClampedArray>()),
    s_TFloat32Array: collection(model<typeof TFloat32Array>()),
    s_TFloat64Array: collection(model<typeof TFloat64Array>()),
    s_TBuffer: collection(model<typeof TBuffer>()),
    s_TDataView: collection(model<typeof TDataView>()),
    s_TDate: collection(model<typeof TDate>()),
    s_TError: collection(model<typeof TError>()),
    s_TRegExp: collection(model<typeof TRegExp>()),
    s_TArray: collection(model<typeof TArray>()),
    s_TObject: collection(model<typeof TObject>()),
    s_TSet: collection(model<typeof TSet>()),
    s_TMap: collection(model<typeof TMap>()),
    i: collection(model<typeof TObject>(), {
      indices: { TString: "primary", TNumber: "secondary" },
    }),
    is: collection(model<typeof TObject>(), {
      serialize: "json",
      indices: { TString: "primary", TNumber: "secondary" },
    }),
  });
}

Deno.test("ext - migrate", async (t) => {
  await t.step("Should only migrate kvdex entries", async () => {
    const temp = await Deno.makeTempFile({ suffix: ".sqlite3" });
    using sourceKv = await Deno.openKv(":memory:");
    using targetKv = await Deno.openKv(temp);

    const check_cr = await sourceKv.set(["check"], "check");
    assert(check_cr.ok);

    const sourceDb = createDb(sourceKv);

    const c_TUndefined_cr = await sourceDb.c_TUndefined.add(TUndefined);
    const c_TNull_cr = await sourceDb.c_TNull.add(TNull);
    const c_TNaN_cr = await sourceDb.c_TNaN.add(TNaN);
    const c_TInfinity_cr = await sourceDb.c_TInfinity.add(TInfinity);
    const c_TNumber_cr = await sourceDb.c_TNumber.add(TNumber);
    const c_TString_cr = await sourceDb.c_TString.add(TString);
    const c_TKvU64_cr = await sourceDb.c_TKvU64.add(TKvU64);
    const c_TBoolean_cr = await sourceDb.c_TBoolean.add(TBoolean);
    const c_TBigint_cr = await sourceDb.c_TBigint.add(TBigint);
    const c_TInt8Array_cr = await sourceDb.c_TInt8Array.add(TInt8Array);
    const c_TInt16Array_cr = await sourceDb.c_TInt16Array.add(TInt16Array);
    const c_TInt32Array_cr = await sourceDb.c_TInt32Array.add(TInt32Array);
    const c_TBigInt64Array_cr = await sourceDb.c_TBigInt64Array.add(
      TBigInt64Array,
    );
    const c_TUint8Array_cr = await sourceDb.c_TUint8Array.add(TUint8Array);
    const c_TUint16Array_cr = await sourceDb.c_TUint16Array.add(TUint16Array);
    const c_TUint32Array_cr = await sourceDb.c_TUint32Array.add(TUint32Array);
    const c_TBigUint64Array_cr = await sourceDb.c_TBigUint64Array.add(
      TBigUint64Array,
    );
    const c_TUint8ClampedArray_cr = await sourceDb.c_TUint8ClampedArray.add(
      TUint8ClampedArray,
    );
    const c_TFloat32Array_cr = await sourceDb.c_TFloat32Array.add(
      TFloat32Array,
    );
    const c_TFloat64Array_cr = await sourceDb.c_TFloat64Array.add(
      TFloat64Array,
    );
    const c_TBuffer_cr = await sourceDb.c_TBuffer.add(TBuffer);
    const c_TDataView_cr = await sourceDb.c_TDataView.add(TDataView);
    const c_TDate_cr = await sourceDb.c_TDate.add(TDate);
    const c_TRegExp_cr = await sourceDb.c_TRegExp.add(TRegExp);
    const c_TError_cr = await sourceDb.c_TError.add(TError);
    const c_TArray_cr = await sourceDb.c_TArray.add(TArray);
    const c_TObject_cr = await sourceDb.c_TObject.add(TObject);
    const c_TSet_cr = await sourceDb.c_TSet.add(TSet);
    const c_TMap_cr = await sourceDb.c_TMap.add(TMap);
    const s_TUndefined_cr = await sourceDb.s_TUndefined.add(TUndefined);
    const s_TNull_cr = await sourceDb.s_TNull.add(TNull);
    const s_TNaN_cr = await sourceDb.s_TNaN.add(TNaN);
    const s_TInfinity_cr = await sourceDb.s_TInfinity.add(TInfinity);
    const s_TNumber_cr = await sourceDb.s_TNumber.add(TNumber);
    const s_TString_cr = await sourceDb.s_TString.add(TString);
    const s_TKvU64_cr = await sourceDb.s_TKvU64.add(TKvU64);
    const s_TBoolean_cr = await sourceDb.s_TBoolean.add(TBoolean);
    const s_TBigint_cr = await sourceDb.s_TBigint.add(TBigint);
    const s_TInt8Array_cr = await sourceDb.s_TInt8Array.add(TInt8Array);
    const s_TInt16Array_cr = await sourceDb.s_TInt16Array.add(TInt16Array);
    const s_TInt32Array_cr = await sourceDb.s_TInt32Array.add(TInt32Array);
    const s_TBigInt64Array_cr = await sourceDb.s_TBigInt64Array.add(
      TBigInt64Array,
    );
    const s_TUint8Array_cr = await sourceDb.s_TUint8Array.add(TUint8Array);
    const s_TUint16Array_cr = await sourceDb.s_TUint16Array.add(TUint16Array);
    const s_TUint32Array_cr = await sourceDb.s_TUint32Array.add(TUint32Array);
    const s_TBigUint64Array_cr = await sourceDb.s_TBigUint64Array.add(
      TBigUint64Array,
    );
    const s_TUint8ClampedArray_cr = await sourceDb.s_TUint8ClampedArray.add(
      TUint8ClampedArray,
    );
    const s_TFloat32Array_cr = await sourceDb.s_TFloat32Array.add(
      TFloat32Array,
    );
    const s_TFloat64Array_cr = await sourceDb.s_TFloat64Array.add(
      TFloat64Array,
    );
    const s_TBuffer_cr = await sourceDb.s_TBuffer.add(TBuffer);
    const s_TDataView_cr = await sourceDb.s_TDataView.add(TDataView);
    const s_TDate_cr = await sourceDb.s_TDate.add(TDate);
    const s_TRegExp_cr = await sourceDb.s_TRegExp.add(TRegExp);
    const s_TError_cr = await sourceDb.s_TError.add(TError);
    const s_TArray_cr = await sourceDb.s_TArray.add(TArray);
    const s_TObject_cr = await sourceDb.s_TObject.add(TObject);
    const s_TSet_cr = await sourceDb.s_TSet.add(TSet);
    const s_TMap_cr = await sourceDb.s_TMap.add(TMap);
    const i_cr = await sourceDb.i.add(TObject);
    const is_cr = await sourceDb.is.add(TObject);

    assert(c_TUndefined_cr.ok);
    assert(c_TNull_cr.ok);
    assert(c_TNaN_cr.ok);
    assert(c_TInfinity_cr.ok);
    assert(c_TString_cr.ok);
    assert(c_TNumber_cr.ok);
    assert(c_TBigint_cr.ok);
    assert(c_TBoolean_cr.ok);
    assert(c_TKvU64_cr.ok);
    assert(c_TUint8Array_cr.ok);
    assert(c_TUint16Array_cr.ok);
    assert(c_TUint32Array_cr.ok);
    assert(c_TBigUint64Array_cr.ok);
    assert(c_TUint8ClampedArray_cr.ok);
    assert(c_TInt8Array_cr.ok);
    assert(c_TInt16Array_cr.ok);
    assert(c_TInt32Array_cr.ok);
    assert(c_TBigInt64Array_cr.ok);
    assert(c_TBuffer_cr.ok);
    assert(c_TDataView_cr.ok);
    assert(c_TDate_cr.ok);
    assert(c_TError_cr.ok);
    assert(c_TRegExp_cr.ok);
    assert(c_TFloat32Array_cr.ok);
    assert(c_TFloat64Array_cr.ok);
    assert(c_TArray_cr.ok);
    assert(c_TObject_cr.ok);
    assert(c_TSet_cr.ok);
    assert(c_TMap_cr.ok);
    assert(s_TUndefined_cr.ok);
    assert(s_TNull_cr.ok);
    assert(s_TNaN_cr.ok);
    assert(s_TInfinity_cr.ok);
    assert(s_TString_cr.ok);
    assert(s_TNumber_cr.ok);
    assert(s_TBigint_cr.ok);
    assert(s_TBoolean_cr.ok);
    assert(s_TKvU64_cr.ok);
    assert(s_TUint8Array_cr.ok);
    assert(s_TUint16Array_cr.ok);
    assert(s_TUint32Array_cr.ok);
    assert(s_TBigUint64Array_cr.ok);
    assert(s_TUint8ClampedArray_cr.ok);
    assert(s_TInt8Array_cr.ok);
    assert(s_TInt16Array_cr.ok);
    assert(s_TInt32Array_cr.ok);
    assert(s_TBigInt64Array_cr.ok);
    assert(s_TBuffer_cr.ok);
    assert(s_TDataView_cr.ok);
    assert(s_TDate_cr.ok);
    assert(s_TError_cr.ok);
    assert(s_TRegExp_cr.ok);
    assert(s_TFloat32Array_cr.ok);
    assert(s_TFloat64Array_cr.ok);
    assert(s_TArray_cr.ok);
    assert(s_TObject_cr.ok);
    assert(s_TSet_cr.ok);
    assert(s_TMap_cr.ok);
    assert(i_cr.ok);
    assert(is_cr.ok);

    await migrate({
      source: sourceKv,
      target: targetKv,
    });

    const targetDb = createDb(targetKv);

    const c_TUndefined_doc = await targetDb.c_TUndefined.find(
      c_TUndefined_cr.id,
    );
    const c_TNull_doc = await targetDb.c_TNull.find(c_TNull_cr.id);
    const c_TNaN_doc = await targetDb.c_TNaN.find(c_TNaN_cr.id);
    const c_TInfinity_doc = await targetDb.c_TInfinity.find(c_TInfinity_cr.id);
    const c_TString_doc = await targetDb.c_TString.find(c_TString_cr.id);
    const c_TNumber_doc = await targetDb.c_TNumber.find(c_TNumber_cr.id);
    const c_TBigint_doc = await targetDb.c_TBigint.find(c_TBigint_cr.id);
    const c_TKvU64_doc = await targetDb.c_TKvU64.find(c_TKvU64_cr.id);
    const c_TBoolean_doc = await targetDb.c_TBoolean.find(c_TBoolean_cr.id);
    const c_TInt8Array_doc = await targetDb.c_TInt8Array.find(
      c_TInt8Array_cr.id,
    );
    const c_TInt16Array_doc = await targetDb.c_TInt16Array.find(
      c_TInt16Array_cr.id,
    );
    const c_TInt32Array_doc = await targetDb.c_TInt32Array.find(
      c_TInt32Array_cr.id,
    );
    const c_TBigInt64Array_doc = await targetDb.c_TBigInt64Array.find(
      c_TBigInt64Array_cr.id,
    );
    const c_TUint8Array_doc = await targetDb.c_TUint8Array.find(
      c_TUint8Array_cr.id,
    );
    const c_TUint16Array_doc = await targetDb.c_TUint16Array.find(
      c_TUint16Array_cr.id,
    );
    const c_TUint32Array_doc = await targetDb.c_TUint32Array.find(
      c_TUint32Array_cr.id,
    );
    const c_TBigUint64Array_doc = await targetDb.c_TBigUint64Array.find(
      c_TBigUint64Array_cr.id,
    );
    const c_TUint8ClampedArray_doc = await targetDb.c_TUint8ClampedArray.find(
      c_TUint8ClampedArray_cr.id,
    );
    const c_TFloat32Array_doc = await targetDb.c_TFloat32Array.find(
      c_TFloat32Array_cr.id,
    );
    const c_TFloat64Array_doc = await targetDb.c_TFloat64Array.find(
      c_TFloat64Array_cr.id,
    );
    const c_TBuffer_doc = await targetDb.c_TBuffer.find(c_TBuffer_cr.id);
    const c_TDataView_doc = await targetDb.c_TDataView.find(c_TDataView_cr.id);
    const c_TDate_doc = await targetDb.c_TDate.find(c_TDate_cr.id);
    const c_TError_doc = await targetDb.c_TError.find(c_TError_cr.id);
    const c_TRegExp_doc = await targetDb.c_TRegExp.find(c_TRegExp_cr.id);
    const c_TArray_doc = await targetDb.c_TArray.find(c_TArray_cr.id);
    const c_TObject_doc = await targetDb.c_TObject.find(c_TObject_cr.id);
    const c_TSet_doc = await targetDb.c_TSet.find(c_TSet_cr.id);
    const c_TMap_doc = await targetDb.c_TMap.find(c_TMap_cr.id);
    const s_TUndefined_doc = await targetDb.s_TUndefined.find(
      s_TUndefined_cr.id,
    );
    const s_TNull_doc = await targetDb.s_TNull.find(s_TNull_cr.id);
    const s_TNaN_doc = await targetDb.s_TNaN.find(s_TNaN_cr.id);
    const s_TInfinity_doc = await targetDb.s_TInfinity.find(s_TInfinity_cr.id);
    const s_TString_doc = await targetDb.s_TString.find(s_TString_cr.id);
    const s_TNumber_doc = await targetDb.s_TNumber.find(s_TNumber_cr.id);
    const s_TBigint_doc = await targetDb.s_TBigint.find(s_TBigint_cr.id);
    const s_TKvU64_doc = await targetDb.s_TKvU64.find(s_TKvU64_cr.id);
    const s_TBoolean_doc = await targetDb.s_TBoolean.find(s_TBoolean_cr.id);
    const s_TInt8Array_doc = await targetDb.s_TInt8Array.find(
      s_TInt8Array_cr.id,
    );
    const s_TInt16Array_doc = await targetDb.s_TInt16Array.find(
      s_TInt16Array_cr.id,
    );
    const s_TInt32Array_doc = await targetDb.s_TInt32Array.find(
      s_TInt32Array_cr.id,
    );
    const s_TBigInt64Array_doc = await targetDb.s_TBigInt64Array.find(
      s_TBigInt64Array_cr.id,
    );
    const s_TUint8Array_doc = await targetDb.s_TUint8Array.find(
      s_TUint8Array_cr.id,
    );
    const s_TUint16Array_doc = await targetDb.s_TUint16Array.find(
      s_TUint16Array_cr.id,
    );
    const s_TUint32Array_doc = await targetDb.s_TUint32Array.find(
      s_TUint32Array_cr.id,
    );
    const s_TBigUint64Array_doc = await targetDb.s_TBigUint64Array.find(
      s_TBigUint64Array_cr.id,
    );
    const s_TUint8ClampedArray_doc = await targetDb.s_TUint8ClampedArray.find(
      s_TUint8ClampedArray_cr.id,
    );
    const s_TFloat32Array_doc = await targetDb.s_TFloat32Array.find(
      s_TFloat32Array_cr.id,
    );
    const s_TFloat64Array_doc = await targetDb.s_TFloat64Array.find(
      s_TFloat64Array_cr.id,
    );
    const s_TBuffer_doc = await targetDb.s_TBuffer.find(s_TBuffer_cr.id);
    const s_TDataView_doc = await targetDb.s_TDataView.find(s_TDataView_cr.id);
    const s_TDate_doc = await targetDb.s_TDate.find(s_TDate_cr.id);
    const s_TError_doc = await targetDb.s_TError.find(s_TError_cr.id);
    const s_TRegExp_doc = await targetDb.s_TRegExp.find(s_TRegExp_cr.id);
    const s_TArray_doc = await targetDb.s_TArray.find(s_TArray_cr.id);
    const s_TObject_doc = await targetDb.s_TObject.find(s_TObject_cr.id);
    const s_TSet_doc = await targetDb.s_TSet.find(s_TSet_cr.id);
    const s_TMap_doc = await targetDb.s_TMap.find(s_TMap_cr.id);
    const i_doc = await targetDb.i.find(i_cr.id);
    const is_doc = await targetDb.is.find(is_cr.id);
    const check = await targetKv.get(["check"]);

    assertEquals(c_TUndefined_doc?.value, TUndefined);
    assertEquals(c_TNull_doc?.value, TNull);
    assertEquals(c_TNaN_doc?.value, TNaN);
    assertEquals(c_TInfinity_doc?.value, TInfinity);
    assertEquals(c_TString_doc?.value, TString);
    assertEquals(c_TNumber_doc?.value, TNumber);
    assertEquals(c_TBigint_doc?.value, TBigint);
    assertEquals(c_TBoolean_doc?.value, TBoolean);
    assertEquals(c_TKvU64_doc?.value, TKvU64);
    assertEquals(c_TInt8Array_doc?.value, TInt8Array);
    assertEquals(c_TInt16Array_doc?.value, TInt16Array);
    assertEquals(c_TInt32Array_doc?.value, TInt32Array);
    assertEquals(c_TBigInt64Array_doc?.value, TBigInt64Array);
    assertEquals(c_TUint8Array_doc?.value, TUint8Array);
    assertEquals(c_TUint16Array_doc?.value, TUint16Array);
    assertEquals(c_TUint32Array_doc?.value, TUint32Array);
    assertEquals(c_TBigUint64Array_doc?.value, TBigUint64Array);
    assertEquals(c_TUint8ClampedArray_doc?.value, TUint8ClampedArray);
    assertEquals(c_TFloat32Array_doc?.value, TFloat32Array);
    assertEquals(c_TFloat64Array_doc?.value, TFloat64Array);
    assertEquals(c_TBuffer_doc?.value, TBuffer);
    assertEquals(c_TDataView_doc?.value, TDataView);
    assertEquals(c_TDate_doc?.value, TDate);
    assertEquals(c_TError_doc?.value, TError);
    assertEquals(c_TRegExp_doc?.value, TRegExp);
    assertEquals(c_TArray_doc?.value, TArray);
    assertEquals(c_TObject_doc?.value, TObject);
    assertEquals(c_TSet_doc?.value, TSet);
    assertEquals(c_TMap_doc?.value, TMap);
    assertEquals(s_TUndefined_doc?.value, TUndefined);
    assertEquals(s_TNull_doc?.value, TNull);
    assertEquals(s_TNaN_doc?.value, TNaN);
    assertEquals(s_TInfinity_doc?.value, TInfinity);
    assertEquals(s_TString_doc?.value, TString);
    assertEquals(s_TNumber_doc?.value, TNumber);
    assertEquals(s_TBigint_doc?.value, TBigint);
    assertEquals(s_TBoolean_doc?.value, TBoolean);
    assertEquals(s_TKvU64_doc?.value, TKvU64);
    assertEquals(s_TInt8Array_doc?.value, TInt8Array);
    assertEquals(s_TInt16Array_doc?.value, TInt16Array);
    assertEquals(s_TInt32Array_doc?.value, TInt32Array);
    assertEquals(s_TBigInt64Array_doc?.value, TBigInt64Array);
    assertEquals(s_TUint8Array_doc?.value, TUint8Array);
    assertEquals(s_TUint16Array_doc?.value, TUint16Array);
    assertEquals(s_TUint32Array_doc?.value, TUint32Array);
    assertEquals(s_TBigUint64Array_doc?.value, TBigUint64Array);
    assertEquals(s_TUint8ClampedArray_doc?.value, TUint8ClampedArray);
    assertEquals(s_TFloat32Array_doc?.value, TFloat32Array);
    assertEquals(s_TFloat64Array_doc?.value, TFloat64Array);
    assertEquals(s_TBuffer_doc?.value, TBuffer);
    assertEquals(s_TDataView_doc?.value, TDataView);
    assertEquals(s_TDate_doc?.value, TDate);
    assertEquals(s_TError_doc?.value, TError);
    assertEquals(s_TRegExp_doc?.value, TRegExp);
    assertEquals(s_TArray_doc?.value, TArray);
    assertEquals(s_TObject_doc?.value, TObject);
    assertEquals(s_TSet_doc?.value, TSet);
    assertEquals(s_TMap_doc?.value, TMap);
    assertEquals(i_doc?.value, TObject);
    assertEquals(is_doc?.value, TObject);
    assert(!check.versionstamp && !check.value);

    sourceKv.close();
    targetKv.close();

    await Deno.remove(temp);
  });

  await t.step("Should migrate all entries", async () => {
    const temp = await Deno.makeTempFile({ suffix: ".sqlite3" });
    using sourceKv = await Deno.openKv(":memory:");
    using targetKv = await Deno.openKv(temp);

    const check_cr = await sourceKv.set(["check"], "check");
    assert(check_cr.ok);

    const sourceDb = createDb(sourceKv);

    const c_TUndefined_cr = await sourceDb.c_TUndefined.add(TUndefined);
    const c_TNull_cr = await sourceDb.c_TNull.add(TNull);
    const c_TNaN_cr = await sourceDb.c_TNaN.add(TNaN);
    const c_TInfinity_cr = await sourceDb.c_TInfinity.add(TInfinity);
    const c_TNumber_cr = await sourceDb.c_TNumber.add(TNumber);
    const c_TString_cr = await sourceDb.c_TString.add(TString);
    const c_TKvU64_cr = await sourceDb.c_TKvU64.add(TKvU64);
    const c_TBoolean_cr = await sourceDb.c_TBoolean.add(TBoolean);
    const c_TBigint_cr = await sourceDb.c_TBigint.add(TBigint);
    const c_TInt8Array_cr = await sourceDb.c_TInt8Array.add(TInt8Array);
    const c_TInt16Array_cr = await sourceDb.c_TInt16Array.add(TInt16Array);
    const c_TInt32Array_cr = await sourceDb.c_TInt32Array.add(TInt32Array);
    const c_TBigInt64Array_cr = await sourceDb.c_TBigInt64Array.add(
      TBigInt64Array,
    );
    const c_TUint8Array_cr = await sourceDb.c_TUint8Array.add(TUint8Array);
    const c_TUint16Array_cr = await sourceDb.c_TUint16Array.add(TUint16Array);
    const c_TUint32Array_cr = await sourceDb.c_TUint32Array.add(TUint32Array);
    const c_TBigUint64Array_cr = await sourceDb.c_TBigUint64Array.add(
      TBigUint64Array,
    );
    const c_TUint8ClampedArray_cr = await sourceDb.c_TUint8ClampedArray.add(
      TUint8ClampedArray,
    );
    const c_TFloat32Array_cr = await sourceDb.c_TFloat32Array.add(
      TFloat32Array,
    );
    const c_TFloat64Array_cr = await sourceDb.c_TFloat64Array.add(
      TFloat64Array,
    );
    const c_TBuffer_cr = await sourceDb.c_TBuffer.add(TBuffer);
    const c_TDataView_cr = await sourceDb.c_TDataView.add(TDataView);
    const c_TDate_cr = await sourceDb.c_TDate.add(TDate);
    const c_TRegExp_cr = await sourceDb.c_TRegExp.add(TRegExp);
    const c_TError_cr = await sourceDb.c_TError.add(TError);
    const c_TArray_cr = await sourceDb.c_TArray.add(TArray);
    const c_TObject_cr = await sourceDb.c_TObject.add(TObject);
    const c_TSet_cr = await sourceDb.c_TSet.add(TSet);
    const c_TMap_cr = await sourceDb.c_TMap.add(TMap);
    const s_TUndefined_cr = await sourceDb.s_TUndefined.add(TUndefined);
    const s_TNull_cr = await sourceDb.s_TNull.add(TNull);
    const s_TNaN_cr = await sourceDb.s_TNaN.add(TNaN);
    const s_TInfinity_cr = await sourceDb.s_TInfinity.add(TInfinity);
    const s_TNumber_cr = await sourceDb.s_TNumber.add(TNumber);
    const s_TString_cr = await sourceDb.s_TString.add(TString);
    const s_TKvU64_cr = await sourceDb.s_TKvU64.add(TKvU64);
    const s_TBoolean_cr = await sourceDb.s_TBoolean.add(TBoolean);
    const s_TBigint_cr = await sourceDb.s_TBigint.add(TBigint);
    const s_TInt8Array_cr = await sourceDb.s_TInt8Array.add(TInt8Array);
    const s_TInt16Array_cr = await sourceDb.s_TInt16Array.add(TInt16Array);
    const s_TInt32Array_cr = await sourceDb.s_TInt32Array.add(TInt32Array);
    const s_TBigInt64Array_cr = await sourceDb.s_TBigInt64Array.add(
      TBigInt64Array,
    );
    const s_TUint8Array_cr = await sourceDb.s_TUint8Array.add(TUint8Array);
    const s_TUint16Array_cr = await sourceDb.s_TUint16Array.add(TUint16Array);
    const s_TUint32Array_cr = await sourceDb.s_TUint32Array.add(TUint32Array);
    const s_TBigUint64Array_cr = await sourceDb.s_TBigUint64Array.add(
      TBigUint64Array,
    );
    const s_TUint8ClampedArray_cr = await sourceDb.s_TUint8ClampedArray.add(
      TUint8ClampedArray,
    );
    const s_TFloat32Array_cr = await sourceDb.s_TFloat32Array.add(
      TFloat32Array,
    );
    const s_TFloat64Array_cr = await sourceDb.s_TFloat64Array.add(
      TFloat64Array,
    );
    const s_TBuffer_cr = await sourceDb.s_TBuffer.add(TBuffer);
    const s_TDataView_cr = await sourceDb.s_TDataView.add(TDataView);
    const s_TDate_cr = await sourceDb.s_TDate.add(TDate);
    const s_TRegExp_cr = await sourceDb.s_TRegExp.add(TRegExp);
    const s_TError_cr = await sourceDb.s_TError.add(TError);
    const s_TArray_cr = await sourceDb.s_TArray.add(TArray);
    const s_TObject_cr = await sourceDb.s_TObject.add(TObject);
    const s_TSet_cr = await sourceDb.s_TSet.add(TSet);
    const s_TMap_cr = await sourceDb.s_TMap.add(TMap);
    const i_cr = await sourceDb.i.add(TObject);
    const is_cr = await sourceDb.is.add(TObject);

    assert(c_TUndefined_cr.ok);
    assert(c_TNull_cr.ok);
    assert(c_TNaN_cr.ok);
    assert(c_TInfinity_cr.ok);
    assert(c_TString_cr.ok);
    assert(c_TNumber_cr.ok);
    assert(c_TBigint_cr.ok);
    assert(c_TBoolean_cr.ok);
    assert(c_TKvU64_cr.ok);
    assert(c_TUint8Array_cr.ok);
    assert(c_TUint16Array_cr.ok);
    assert(c_TUint32Array_cr.ok);
    assert(c_TBigUint64Array_cr.ok);
    assert(c_TUint8ClampedArray_cr.ok);
    assert(c_TInt8Array_cr.ok);
    assert(c_TInt16Array_cr.ok);
    assert(c_TInt32Array_cr.ok);
    assert(c_TBigInt64Array_cr.ok);
    assert(c_TBuffer_cr.ok);
    assert(c_TDataView_cr.ok);
    assert(c_TDate_cr.ok);
    assert(c_TError_cr.ok);
    assert(c_TRegExp_cr.ok);
    assert(c_TFloat32Array_cr.ok);
    assert(c_TFloat64Array_cr.ok);
    assert(c_TArray_cr.ok);
    assert(c_TObject_cr.ok);
    assert(c_TSet_cr.ok);
    assert(c_TMap_cr.ok);
    assert(s_TUndefined_cr.ok);
    assert(s_TNull_cr.ok);
    assert(s_TNaN_cr.ok);
    assert(s_TInfinity_cr.ok);
    assert(s_TString_cr.ok);
    assert(s_TNumber_cr.ok);
    assert(s_TBigint_cr.ok);
    assert(s_TBoolean_cr.ok);
    assert(s_TKvU64_cr.ok);
    assert(s_TUint8Array_cr.ok);
    assert(s_TUint16Array_cr.ok);
    assert(s_TUint32Array_cr.ok);
    assert(s_TBigUint64Array_cr.ok);
    assert(s_TUint8ClampedArray_cr.ok);
    assert(s_TInt8Array_cr.ok);
    assert(s_TInt16Array_cr.ok);
    assert(s_TInt32Array_cr.ok);
    assert(s_TBigInt64Array_cr.ok);
    assert(s_TBuffer_cr.ok);
    assert(s_TDataView_cr.ok);
    assert(s_TDate_cr.ok);
    assert(s_TError_cr.ok);
    assert(s_TRegExp_cr.ok);
    assert(s_TFloat32Array_cr.ok);
    assert(s_TFloat64Array_cr.ok);
    assert(s_TArray_cr.ok);
    assert(s_TObject_cr.ok);
    assert(s_TSet_cr.ok);
    assert(s_TMap_cr.ok);
    assert(i_cr.ok);
    assert(is_cr.ok);

    await migrate({
      source: sourceKv,
      target: targetKv,
      all: true,
    });

    const targetDb = createDb(targetKv);

    const c_TUndefined_doc = await targetDb.c_TUndefined.find(
      c_TUndefined_cr.id,
    );
    const c_TNull_doc = await targetDb.c_TNull.find(c_TNull_cr.id);
    const c_TNaN_doc = await targetDb.c_TNaN.find(c_TNaN_cr.id);
    const c_TInfinity_doc = await targetDb.c_TInfinity.find(c_TInfinity_cr.id);
    const c_TString_doc = await targetDb.c_TString.find(c_TString_cr.id);
    const c_TNumber_doc = await targetDb.c_TNumber.find(c_TNumber_cr.id);
    const c_TBigint_doc = await targetDb.c_TBigint.find(c_TBigint_cr.id);
    const c_TKvU64_doc = await targetDb.c_TKvU64.find(c_TKvU64_cr.id);
    const c_TBoolean_doc = await targetDb.c_TBoolean.find(c_TBoolean_cr.id);
    const c_TInt8Array_doc = await targetDb.c_TInt8Array.find(
      c_TInt8Array_cr.id,
    );
    const c_TInt16Array_doc = await targetDb.c_TInt16Array.find(
      c_TInt16Array_cr.id,
    );
    const c_TInt32Array_doc = await targetDb.c_TInt32Array.find(
      c_TInt32Array_cr.id,
    );
    const c_TBigInt64Array_doc = await targetDb.c_TBigInt64Array.find(
      c_TBigInt64Array_cr.id,
    );
    const c_TUint8Array_doc = await targetDb.c_TUint8Array.find(
      c_TUint8Array_cr.id,
    );
    const c_TUint16Array_doc = await targetDb.c_TUint16Array.find(
      c_TUint16Array_cr.id,
    );
    const c_TUint32Array_doc = await targetDb.c_TUint32Array.find(
      c_TUint32Array_cr.id,
    );
    const c_TBigUint64Array_doc = await targetDb.c_TBigUint64Array.find(
      c_TBigUint64Array_cr.id,
    );
    const c_TUint8ClampedArray_doc = await targetDb.c_TUint8ClampedArray.find(
      c_TUint8ClampedArray_cr.id,
    );
    const c_TFloat32Array_doc = await targetDb.c_TFloat32Array.find(
      c_TFloat32Array_cr.id,
    );
    const c_TFloat64Array_doc = await targetDb.c_TFloat64Array.find(
      c_TFloat64Array_cr.id,
    );
    const c_TBuffer_doc = await targetDb.c_TBuffer.find(c_TBuffer_cr.id);
    const c_TDataView_doc = await targetDb.c_TDataView.find(c_TDataView_cr.id);
    const c_TDate_doc = await targetDb.c_TDate.find(c_TDate_cr.id);
    const c_TError_doc = await targetDb.c_TError.find(c_TError_cr.id);
    const c_TRegExp_doc = await targetDb.c_TRegExp.find(c_TRegExp_cr.id);
    const c_TArray_doc = await targetDb.c_TArray.find(c_TArray_cr.id);
    const c_TObject_doc = await targetDb.c_TObject.find(c_TObject_cr.id);
    const c_TSet_doc = await targetDb.c_TSet.find(c_TSet_cr.id);
    const c_TMap_doc = await targetDb.c_TMap.find(c_TMap_cr.id);
    const s_TUndefined_doc = await targetDb.s_TUndefined.find(
      s_TUndefined_cr.id,
    );
    const s_TNull_doc = await targetDb.s_TNull.find(s_TNull_cr.id);
    const s_TNaN_doc = await targetDb.s_TNaN.find(s_TNaN_cr.id);
    const s_TInfinity_doc = await targetDb.s_TInfinity.find(s_TInfinity_cr.id);
    const s_TString_doc = await targetDb.s_TString.find(s_TString_cr.id);
    const s_TNumber_doc = await targetDb.s_TNumber.find(s_TNumber_cr.id);
    const s_TBigint_doc = await targetDb.s_TBigint.find(s_TBigint_cr.id);
    const s_TKvU64_doc = await targetDb.s_TKvU64.find(s_TKvU64_cr.id);
    const s_TBoolean_doc = await targetDb.s_TBoolean.find(s_TBoolean_cr.id);
    const s_TInt8Array_doc = await targetDb.s_TInt8Array.find(
      s_TInt8Array_cr.id,
    );
    const s_TInt16Array_doc = await targetDb.s_TInt16Array.find(
      s_TInt16Array_cr.id,
    );
    const s_TInt32Array_doc = await targetDb.s_TInt32Array.find(
      s_TInt32Array_cr.id,
    );
    const s_TBigInt64Array_doc = await targetDb.s_TBigInt64Array.find(
      s_TBigInt64Array_cr.id,
    );
    const s_TUint8Array_doc = await targetDb.s_TUint8Array.find(
      s_TUint8Array_cr.id,
    );
    const s_TUint16Array_doc = await targetDb.s_TUint16Array.find(
      s_TUint16Array_cr.id,
    );
    const s_TUint32Array_doc = await targetDb.s_TUint32Array.find(
      s_TUint32Array_cr.id,
    );
    const s_TBigUint64Array_doc = await targetDb.s_TBigUint64Array.find(
      s_TBigUint64Array_cr.id,
    );
    const s_TUint8ClampedArray_doc = await targetDb.s_TUint8ClampedArray.find(
      s_TUint8ClampedArray_cr.id,
    );
    const s_TFloat32Array_doc = await targetDb.s_TFloat32Array.find(
      s_TFloat32Array_cr.id,
    );
    const s_TFloat64Array_doc = await targetDb.s_TFloat64Array.find(
      s_TFloat64Array_cr.id,
    );
    const s_TBuffer_doc = await targetDb.s_TBuffer.find(s_TBuffer_cr.id);
    const s_TDataView_doc = await targetDb.s_TDataView.find(s_TDataView_cr.id);
    const s_TDate_doc = await targetDb.s_TDate.find(s_TDate_cr.id);
    const s_TError_doc = await targetDb.s_TError.find(s_TError_cr.id);
    const s_TRegExp_doc = await targetDb.s_TRegExp.find(s_TRegExp_cr.id);
    const s_TArray_doc = await targetDb.s_TArray.find(s_TArray_cr.id);
    const s_TObject_doc = await targetDb.s_TObject.find(s_TObject_cr.id);
    const s_TSet_doc = await targetDb.s_TSet.find(s_TSet_cr.id);
    const s_TMap_doc = await targetDb.s_TMap.find(s_TMap_cr.id);
    const i_doc = await targetDb.i.find(i_cr.id);
    const is_doc = await targetDb.is.find(is_cr.id);
    const check = await targetKv.get(["check"]);

    assertEquals(c_TUndefined_doc?.value, TUndefined);
    assertEquals(c_TNull_doc?.value, TNull);
    assertEquals(c_TNaN_doc?.value, TNaN);
    assertEquals(c_TInfinity_doc?.value, TInfinity);
    assertEquals(c_TString_doc?.value, TString);
    assertEquals(c_TNumber_doc?.value, TNumber);
    assertEquals(c_TBigint_doc?.value, TBigint);
    assertEquals(c_TBoolean_doc?.value, TBoolean);
    assertEquals(c_TKvU64_doc?.value, TKvU64);
    assertEquals(c_TInt8Array_doc?.value, TInt8Array);
    assertEquals(c_TInt16Array_doc?.value, TInt16Array);
    assertEquals(c_TInt32Array_doc?.value, TInt32Array);
    assertEquals(c_TBigInt64Array_doc?.value, TBigInt64Array);
    assertEquals(c_TUint8Array_doc?.value, TUint8Array);
    assertEquals(c_TUint16Array_doc?.value, TUint16Array);
    assertEquals(c_TUint32Array_doc?.value, TUint32Array);
    assertEquals(c_TBigUint64Array_doc?.value, TBigUint64Array);
    assertEquals(c_TUint8ClampedArray_doc?.value, TUint8ClampedArray);
    assertEquals(c_TFloat32Array_doc?.value, TFloat32Array);
    assertEquals(c_TFloat64Array_doc?.value, TFloat64Array);
    assertEquals(c_TBuffer_doc?.value, TBuffer);
    assertEquals(c_TDataView_doc?.value, TDataView);
    assertEquals(c_TDate_doc?.value, TDate);
    assertEquals(c_TError_doc?.value, TError);
    assertEquals(c_TRegExp_doc?.value, TRegExp);
    assertEquals(c_TArray_doc?.value, TArray);
    assertEquals(c_TObject_doc?.value, TObject);
    assertEquals(c_TSet_doc?.value, TSet);
    assertEquals(c_TMap_doc?.value, TMap);
    assertEquals(s_TUndefined_doc?.value, TUndefined);
    assertEquals(s_TNull_doc?.value, TNull);
    assertEquals(s_TNaN_doc?.value, TNaN);
    assertEquals(s_TInfinity_doc?.value, TInfinity);
    assertEquals(s_TString_doc?.value, TString);
    assertEquals(s_TNumber_doc?.value, TNumber);
    assertEquals(s_TBigint_doc?.value, TBigint);
    assertEquals(s_TBoolean_doc?.value, TBoolean);
    assertEquals(s_TKvU64_doc?.value, TKvU64);
    assertEquals(s_TInt8Array_doc?.value, TInt8Array);
    assertEquals(s_TInt16Array_doc?.value, TInt16Array);
    assertEquals(s_TInt32Array_doc?.value, TInt32Array);
    assertEquals(s_TBigInt64Array_doc?.value, TBigInt64Array);
    assertEquals(s_TUint8Array_doc?.value, TUint8Array);
    assertEquals(s_TUint16Array_doc?.value, TUint16Array);
    assertEquals(s_TUint32Array_doc?.value, TUint32Array);
    assertEquals(s_TBigUint64Array_doc?.value, TBigUint64Array);
    assertEquals(s_TUint8ClampedArray_doc?.value, TUint8ClampedArray);
    assertEquals(s_TFloat32Array_doc?.value, TFloat32Array);
    assertEquals(s_TFloat64Array_doc?.value, TFloat64Array);
    assertEquals(s_TBuffer_doc?.value, TBuffer);
    assertEquals(s_TDataView_doc?.value, TDataView);
    assertEquals(s_TDate_doc?.value, TDate);
    assertEquals(s_TError_doc?.value, TError);
    assertEquals(s_TRegExp_doc?.value, TRegExp);
    assertEquals(s_TArray_doc?.value, TArray);
    assertEquals(s_TObject_doc?.value, TObject);
    assertEquals(s_TSet_doc?.value, TSet);
    assertEquals(s_TMap_doc?.value, TMap);
    assertEquals(i_doc?.value, TObject);
    assertEquals(is_doc?.value, TObject);
    assert(!!check.versionstamp && !!check.value);

    sourceKv.close();
    targetKv.close();

    await Deno.remove(temp);
  });
});
