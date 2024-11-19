import type { DenoKvU64, KvValue } from "../mod.ts";

export const TUndefined = undefined;
export const TNull = null;
export const TNaN = NaN;
export const TInfinity = Infinity;
export const TNumber = 10;
export const TString = "string";
export const TBigint = 10n;
export const TKvU64 = { value: 10n } satisfies DenoKvU64;
export const TBoolean = true;
export const TInt8Array = new Int8Array([10, 20, 30]);
export const TInt16Array = new Int16Array([10, 20, 30]);
export const TInt32Array = new Int32Array([10, 20, 30]);
export const TBigInt64Array = new BigInt64Array([10n, 20n, 30n]);
export const TUint8Array = new Uint8Array([10, 20, 30]);
export const TUint16Array = new Uint16Array([10, 20, 30]);
export const TUint32Array = new Uint32Array([10, 20, 30]);
export const TBigUint64Array = new BigUint64Array([10n, 20n, 30n]);
export const TUint8ClampedArray = new Uint8ClampedArray([10, 20, 30]);
// TODO: export const TFloat16Array = new Float16Array([10.203423878293472837429384]);
export const TFloat32Array = new Float32Array([10.203423878293472837429384]);
export const TFloat64Array = new Float64Array([10.203423878293472837429384]);
export const TBuffer = new Uint8Array([10, 20, 30]).buffer;
export const TDate = new Date();
export const TRegExp = new RegExp("[0-9]");
export const TDataView = new DataView(new Uint8Array([10, 20, 30]).buffer);
export const TError = new Error("error");
export const TArray = [
  TUndefined,
  TNull,
  TNaN,
  TInfinity,
  TNumber,
  TString,
  TBigint,
  TKvU64,
  TBoolean,
  TInt8Array,
  TInt16Array,
  TInt32Array,
  TBigInt64Array,
  TUint8Array,
  TUint16Array,
  TUint32Array,
  TBigUint64Array,
  TUint8ClampedArray,
  //TFloat16Array,
  TFloat32Array,
  TFloat64Array,
  TBuffer,
  TDate,
  TRegExp,
  TDataView,
  TError,
];
export const TObject = {
  TUndefined,
  TNull,
  TNaN,
  TInfinity,
  TNumber,
  TString,
  TBigint,
  TKvU64,
  TBoolean,
  TInt8Array,
  TInt16Array,
  TInt32Array,
  TBigInt64Array,
  TUint8Array,
  TUint16Array,
  TUint32Array,
  TBigUint64Array,
  TUint8ClampedArray,
  // TODO: TFloat16Array,
  TFloat32Array,
  TFloat64Array,
  TBuffer,
  TDate,
  TRegExp,
  TDataView,
  TError,
  TArray,
};

export const TSet = new Set<KvValue>(TArray);
export const TMap = new Map<KvValue, KvValue>(TArray.map((val, i) => [i, val]));

export const VALUES = [
  TUndefined,
  TNull,
  TNaN,
  TInfinity,
  TNumber,
  TString,
  TBigint,
  TKvU64,
  TBoolean,
  TInt8Array,
  TInt16Array,
  TInt32Array,
  TBigInt64Array,
  TUint8Array,
  TUint16Array,
  TUint32Array,
  TBigUint64Array,
  TUint8ClampedArray,
  // TODO: TFloat16Array,
  TFloat32Array,
  TFloat64Array,
  TBuffer,
  TDate,
  TRegExp,
  TDataView,
  TError,
  TArray,
  TObject,
  TSet,
  TMap,
];
