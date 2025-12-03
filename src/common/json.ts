import type { Compressor, Encoder, KvObject, KvValue } from "../core/types.ts";
import { isKvObject } from "../core/utils.ts";
import { replaceDataView, reviveDataView } from "./data_view.ts";
import { mapValue } from "./map_value.ts";
import { TypeKey } from "./type_key.ts";

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

/** Options for JSON encoding. */
export type JsonEncoderOptions = {
  /** Optional compressor object. */
  compressor?: Compressor;
};

/**
 * JSON-encoder.
 *
 * Used for serializing and deserializing data as Uint8Array.
 *
 * @param options - JSON encoding options.
 * @returns - An Encoder object.
 */
export function jsonEncoder(options?: JsonEncoderOptions): Encoder {
  return {
    serializer: {
      serialize: jsonSerialize,
      deserialize: jsonDeserialize,
    },
    compressor: options?.compressor,
  };
}

/**
 * Serialize a JSON-like value to a Uint8Array.
 *
 * @example
 * ```ts
 * import { jsonSerialize } from "@olli/kvdex"
 *
 * const serialized = jsonSerialize({
 *   foo: "foo",
 *   bar: "bar",
 *   bigint: 10n
 * })
 * ```
 *
 * @param value - Value to be serialized.
 * @returns Serialized value.
 */
export function jsonSerialize(value: unknown): Uint8Array {
  const str = jsonStringify(value);
  return TEXT_ENCODER.encode(str);
}

/**
 * Deserialize a value that was serialized using `jsonSerialize()`.
 *
 * @example
 * ```ts
 * import { jsonSerialize, jsonDeserialize } from "@olli/kvdex"
 *
 * const serialized = jsonSerialize({
 *   foo: "foo",
 *   bar: "bar",
 *   bigint: 10n
 * })
 *
 * const value = jsonDeserialize(serialized)
 * ```
 *
 * @param value - Value to be deserialize.
 * @returns Deserialized value.
 */
export function jsonDeserialize<T>(value: Uint8Array): T {
  const str = TEXT_DECODER.decode(value);
  return jsonParse<T>(str);
}

/**
 * Stringify a JSON-like value.
 *
 * @example
 * ```ts
 * import { jsonStringify } from "@olli/kvdex"
 *
 * const str = jsonStringify({
 *   foo: "foo",
 *   bar: "bar",
 *   bigint: 10n
 * })
 * ```
 *
 * @param value
 * @param space
 * @returns
 */
export function jsonStringify(value: unknown, space?: number | string): string {
  return JSON.stringify(_replacer(value), replacer, space);
}

/**
 * Parse a value that was stringified using `jsonStringify()`
 *
 * @example
 * ```ts
 * import { jsonStringify, jsonParse } from "@olli/kvdex"
 *
 * const str = jsonStringify({
 *   foo: "foo",
 *   bar: "bar",
 *   bigint: 10n
 * })
 *
 * const value = jsonParse(str)
 * ```
 *
 * @param value
 * @returns
 */
export function jsonParse<T>(value: string): T {
  return postReviver(JSON.parse(value, reviver)) as T;
}

/**
 * Outer replacer function.
 *
 * @param _key
 * @param value
 * @returns
 */
function replacer(_key: string, value: unknown): unknown {
  return _replacer(value);
}

type JSONError = {
  message: string;
  name: string;
  cause?: unknown;
  stack?: string;
};

/**
 * Inner replacer function.
 *
 * @param value
 * @returns
 */
function _replacer(value: unknown): unknown {
  // undefined
  if (value === undefined) {
    return {
      [TypeKey.Undefined]: false,
    };
  }

  // NaN
  if (Number.isNaN(value)) {
    return {
      [TypeKey.NaN]: false,
    };
  }

  // Infinity
  if (value === Infinity) {
    return {
      [TypeKey.Infinity]: false,
    };
  }

  // bigint
  if (typeof value === "bigint") {
    return {
      [TypeKey.BigInt]: value.toString(),
    };
  }

  // Date
  if (value instanceof Date) {
    return {
      [TypeKey.Date]: value.toISOString(),
    };
  }

  // Array
  if (Array.isArray(value)) {
    return value.map(_replacer);
  }

  // Set
  if (value instanceof Set) {
    return {
      [TypeKey.Set]: Array.from(value.values()).map(_replacer),
    };
  }

  // Map
  if (value instanceof Map) {
    return {
      [TypeKey.Map]: Array.from(value.entries()).map((
        [k, v],
      ) => [k, _replacer(v)]),
    };
  }

  // RegExp
  if (value instanceof RegExp) {
    return {
      [TypeKey.RegExp]: value.source,
    };
  }

  // Error
  if (value instanceof Error) {
    const jsonError: JSONError = {
      message: value.message,
      name: value.name,
      stack: value.stack,
      ...(value.cause ? { cause: _replacer(value.cause) } : {}),
    };

    return {
      [TypeKey.Error]: jsonError,
    };
  }

  // Int8Array
  if (value instanceof Int8Array) {
    return {
      [TypeKey.Int8Array]: Array.from(value),
    };
  }

  // Int16Array
  if (value instanceof Int16Array) {
    return {
      [TypeKey.Int16Array]: Array.from(value),
    };
  }

  // Int32Array
  if (value instanceof Int32Array) {
    return {
      [TypeKey.Int32Array]: Array.from(value),
    };
  }

  // BigInt64Array
  if (value instanceof BigInt64Array) {
    return {
      [TypeKey.BigInt64Array]: Array.from(value),
    };
  }

  // Uint8Array
  if (value instanceof Uint8Array) {
    return {
      [TypeKey.Uint8Array]: Array.from(value),
    };
  }

  // Uint16Array
  if (value instanceof Uint16Array) {
    return {
      [TypeKey.Uint16Array]: Array.from(value),
    };
  }

  // Uint32Array
  if (value instanceof Uint32Array) {
    return {
      [TypeKey.Uint32Array]: Array.from(value),
    };
  }

  // BigUint64Array
  if (value instanceof BigUint64Array) {
    return {
      [TypeKey.BigUint64Array]: Array.from(value),
    };
  }

  // Uint8ClampedArray
  if (value instanceof Uint8ClampedArray) {
    return {
      [TypeKey.Uint8ClampedArray]: Array.from(value),
    };
  }

  // TODO:
  /*
  // Float16Array
  if (value instanceof Float16Array) {
    return {
      [TypeKey.Float16Array]: Array.from(value),
    };
  }*/

  // Float32Array
  if (value instanceof Float32Array) {
    return {
      [TypeKey.Float32Array]: Array.from(value),
    };
  }

  // Float64Array
  if (value instanceof Float64Array) {
    return {
      [TypeKey.Float64Array]: Array.from(value),
    };
  }

  // ArrayBuffer
  if (value instanceof ArrayBuffer) {
    return {
      [TypeKey.ArrayBuffer]: Array.from(new Uint8Array(value)),
    };
  }

  // DataView
  if (value instanceof DataView) {
    return replaceDataView(value);
  }

  // KvObject
  if (isKvObject(value)) {
    return Object.fromEntries(
      Object.entries(value as KvObject).map((
        [k, v],
      ) => [k, _replacer(v)]),
    );
  }

  return value;
}

/**
 * Outer reviver function.
 *
 * @param _key
 * @param value
 * @returns
 */
function reviver(_key: string, value: unknown): unknown {
  return _reviver(value);
}

/**
 * Inner reviver function.
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
    return value;
  }

  // bigint
  if (TypeKey.BigInt in value) {
    return BigInt(mapValue(TypeKey.BigInt, value));
  }

  // Date
  if (TypeKey.Date in value) {
    return new Date(mapValue<string>(TypeKey.Date, value));
  }

  // NaN
  if (TypeKey.NaN in value) {
    return NaN;
  }

  // Infnity
  if (TypeKey.Infinity in value) {
    return Infinity;
  }

  // RegExp
  if (TypeKey.RegExp in value) {
    return new RegExp(mapValue(TypeKey.RegExp, value));
  }

  // Error
  if (TypeKey.Error in value) {
    const { message, stack, cause } = mapValue<JSONError>(
      TypeKey.Error,
      value,
    );

    const error = new Error(
      message,
      cause ? { cause } : undefined,
    );

    error.stack = stack;
    return error;
  }

  // Int8Array
  if (TypeKey.Int8Array in value) {
    return Int8Array.from(mapValue(TypeKey.Int8Array, value));
  }

  // Int16Array
  if (TypeKey.Int16Array in value) {
    return Int16Array.from(mapValue(TypeKey.Int16Array, value));
  }

  // Int32Array
  if (TypeKey.Int32Array in value) {
    return Int32Array.from(mapValue(TypeKey.Int32Array, value));
  }

  // BigInt64Array
  if (TypeKey.BigInt64Array in value) {
    return BigInt64Array.from(mapValue(TypeKey.BigInt64Array, value));
  }

  // Uint8Array
  if (TypeKey.Uint8Array in value) {
    return Uint8Array.from(mapValue(TypeKey.Uint8Array, value));
  }

  // Uint16Array
  if (TypeKey.Uint16Array in value) {
    return Uint16Array.from(mapValue(TypeKey.Uint16Array, value));
  }

  // Uint32Array
  if (TypeKey.Uint32Array in value) {
    return Uint32Array.from(mapValue(TypeKey.Uint32Array, value));
  }

  // BigUint64Array
  if (TypeKey.BigUint64Array in value) {
    return BigUint64Array.from(mapValue(TypeKey.BigUint64Array, value));
  }

  // Uint8ClampedArray
  if (TypeKey.Uint8ClampedArray in value) {
    return Uint8ClampedArray.from(
      mapValue(TypeKey.Uint8ClampedArray, value),
    );
  }

  // TODO:
  /*
  // Float16Array
  if (TypeKey.Float16Array in value) {
    return Float16Array.from(mapValue(TypeKey.Float16Array, value));
  }*/

  // Float32Array
  if (TypeKey.Float32Array in value) {
    return Float32Array.from(mapValue(TypeKey.Float32Array, value));
  }

  // Float64Array
  if (TypeKey.Float64Array in value) {
    return Float64Array.from(mapValue(TypeKey.Float64Array, value));
  }

  // ArrayBuffer
  if (TypeKey.ArrayBuffer in value) {
    const uint8array = Uint8Array.from(
      mapValue(TypeKey.ArrayBuffer, value),
    );
    return uint8array.buffer;
  }

  // DataView
  if (TypeKey.DataView in value) {
    return reviveDataView(value);
  }

  // Set
  if (TypeKey.Set in value) {
    return new Set(mapValue<Array<KvValue>>(TypeKey.Set, value));
  }

  // Map
  if (TypeKey.Map in value) {
    return new Map(mapValue<Array<[KvValue, KvValue]>>(TypeKey.Map, value));
  }

  // Array
  if (Array.isArray(value)) {
    return value.map(_reviver);
  }

  // KvObject
  if (isKvObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, _reviver(v)]),
    );
  }

  // Return value
  return value;
}

/**
 * Additional revival steps to perform after initial parse.
 *
 * @param value
 * @returns
 */
function postReviver<T>(value: T): T {
  // Return value if not an object
  if (
    value === undefined ||
    value === null ||
    typeof value !== "object"
  ) {
    return value;
  }

  // undefined
  if (TypeKey.Undefined in value) {
    return undefined as T;
  }

  // Array
  if (Array.isArray(value)) {
    return value.map(postReviver) as T;
  }

  // Set
  if (value instanceof Set) {
    return new Set(
      Array.from(value.values()).map(postReviver),
    ) as T;
  }

  // Map
  if (value instanceof Map) {
    return new Map(
      Array.from(value.entries()).map(([k, v]) => [k, postReviver(v)]),
    ) as T;
  }

  // KvObject
  if (isKvObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, postReviver(v)]),
    ) as T;
  }

  return value;
}
