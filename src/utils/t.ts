type KvValue =
  | Deno.KvU64
  | Int8Array
  | Int16Array
  | Int32Array
  | BigInt64Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | BigUint64Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array
  | ArrayBuffer
  | RegExp
  | DataView
  | Error

enum TypeKey {
  BigInt = "__bigint__",
  KvU64 = "__kvu64__",
  Int8Array = "__int8array__",
  Int16Array = "__int16array__",
  Int32Array = "__int32array__",
  BigInt64Array = "__bigint64array__",
  UInt8Array = "__uint8array__",
  Uint16Array = "__uint16array__",
  Uint32Array = "__uint32array__",
  BigUint64Array = "__biguint64array__",
  Uint8ClampedArray = "__uint8clampedarray__",
  Float32Array = "__float32array__",
  Float64Array = "__float64array__",
  ArrayBuffer = "__arraybuffer__",
  Date = "__date__",
  Set = "__set__",
  Map = "__map__",
  RegExp = "__regexp__",
  DataView = "__dataview__",
  Error = "__error__",
  NaN = "__nan__",
}

function mapValue<T>(key: string, value: unknown) {
  return (value as Record<string, T>)[key]
}

/**
 * Replacer
 *
 * @param value
 * @returns
 */
function _replacer(value: unknown): unknown {
  // Return value if nullish
  if (value === null || value === undefined) {
    return value
  }

  // NaN
  if (Number.isNaN(value)) {
    return {
      [TypeKey.NaN]: false,
    }
  }

  // bigint
  if (typeof value === "bigint") {
    return {
      [TypeKey.BigInt]: value.toString(),
    }
  }

  // Date
  if (value instanceof Date) {
    return {
      [TypeKey.Date]: value.toISOString(),
    }
  }

  // Set
  if (value instanceof Set) {
    const mappedValues: unknown[] = []
    value.forEach((v) => mappedValues.push(_replacer(v)))
    return {
      [TypeKey.Set]: mappedValues,
    }
  }

  // Map
  if (value instanceof Map) {
    const mappedEntries = []
    for (const [k, v] of value.entries()) {
      mappedEntries.push([k, _replacer(v)])
    }
    return {
      [TypeKey.Map]: mappedEntries,
    }
  }

  // Clone value to handle special cases
  const clone = structuredClone(value)
  for (const [k, v] of Object.entries(value)) {
    if (v instanceof Date) {
      clone[k] = _replacer(v)
    }
  }

  // Return clone
  return clone
}

/**
 * Reviver
 *
 * @param value
 * @returns
 */
function _reviver(value: unknown): unknown {
  // Return if nullish or not an object
  if (
    value === null ||
    value === undefined ||
    typeof value !== "object"
  ) {
    return value
  }

  // NaN
  if (TypeKey.NaN in value) {
    return NaN
  }

  // bigint
  if (TypeKey.BigInt in value) {
    return BigInt(mapValue(TypeKey.BigInt, value))
  }

  // Date
  if (TypeKey.Date in value) {
    return new Date(mapValue<string>(TypeKey.Date, value))
  }

  // Set
  if (TypeKey.Set in value) {
    const mappedValues = mapValue<unknown[]>(TypeKey.Set, value)
    return new Set(mappedValues.map((v) => _reviver(v)))
  }

  // Map
  if (TypeKey.Map in value) {
    const mappedEntries = mapValue<[string, unknown][]>(TypeKey.Map, value)
    return new Map(mappedEntries.map(([k, v]) => [k, _reviver(v)]))
  }

  // Return value
  return value
}

function replacer(this: unknown, _key: string, value: unknown) {
  return _replacer(value)
}

function reviver(_key: string, value: unknown) {
  return _reviver(value)
}

// Testing
const obj = {
  bigint: 100n,
  date: new Date(),
  set: new Set([100n, 200n, 300n]),
  map: new Map([[1, 100n], [2, 200n], [3, 300n]]),
  nan: parseInt("klakdlaskld"),
}

const stringified = JSON.stringify(obj, replacer)
const parsed = JSON.parse(stringified, reviver)

console.log(obj)
console.log(parsed)
