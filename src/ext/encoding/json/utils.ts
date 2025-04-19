import { jsonParse, jsonStringify } from "../../_shared/json.ts";

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

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
