import type { Compressor, Encoder, KvObject } from "../../types.ts";
import { isKvObject } from "../../utils.ts";
import { deserialize, serialize } from "node:v8";

export type V8EncoderOptions = {
  compressor?: Compressor;
};

export function v8Encoder(options?: V8EncoderOptions): Encoder {
  return {
    serializer: {
      serialize: v8Serialize,
      deserialize: v8Deserialize,
    },
    compressor: options?.compressor,
  };
}

/**
 * Extended V8 serialize.
 *
 * @param value - Value to be serialized.
 * @returns A serialized value.
 */
export function v8Serialize(value: unknown): Uint8Array {
  return new Uint8Array(serialize(beforeV8Serialize(value)));
}

/**
 * Extended V8 deserialize.
 *
 * @param value - Value to be deserialized.
 * @returns Deserialized value.
 */
export function v8Deserialize<T>(
  value: Uint8Array,
): T {
  return afterV8Serialize(deserialize(value)) as T;
}

/**
 * Additional steps to perform before V8 serialize.
 *
 * @param value
 * @returns
 */
function beforeV8Serialize(value: unknown): unknown {
  // KvObject
  if (isKvObject(value)) {
    return Object.fromEntries(
      Object.entries(value as KvObject).map((
        [key, val],
      ) => [key, beforeV8Serialize(val)]),
    );
  }

  // Array
  if (Array.isArray(value)) {
    return value.map((val) => beforeV8Serialize(val));
  }

  // Set
  if (value instanceof Set) {
    return new Set(
      Array.from(value.values()).map((v) => beforeV8Serialize(v)),
    );
  }

  // Map
  if (value instanceof Map) {
    return new Map(
      Array.from(value.entries()).map((
        [k, v],
      ) => [k, beforeV8Serialize(v)]),
    );
  }

  return value;
}

/**
 * Additional steps to perform after V8 deserialize.
 *
 * @param value
 * @returns
 */
function afterV8Serialize(value: unknown): unknown {
  // Return value if not an object
  if (
    value === undefined ||
    value === null ||
    typeof value !== "object"
  ) {
    return value;
  }

  // KvObject
  if (isKvObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, afterV8Serialize(v)]),
    );
  }

  // Array
  if (Array.isArray(value)) {
    return value.map((v) => afterV8Serialize(v));
  }

  // Set
  if (value instanceof Set) {
    return new Set(
      Array.from(value.values()).map((v) => afterV8Serialize(v)),
    );
  }

  // Map
  if (value instanceof Map) {
    return new Map(
      Array.from(value.entries()).map((
        [k, v],
      ) => [k, afterV8Serialize(v)]),
    );
  }

  return value;
}
