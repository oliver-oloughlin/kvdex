/**
 * @module # JSON
 *
 * JSON-encoder and JSON-utilities for stringifying and serializing data.
 *
 * @example
 * ```ts
 * import { jsonEncoder } from "jsr:@olli/kvdex/encoding/json"
 *
 * // With default options (no compression)
 * const encoder = jsonEncoder()
 * ```
 *
 * @example
 * ```ts
 * import { jsonEncoder } from "jsr:@olli/kvdex/encoding/json"
 * import { brotliCompressor } from "jsr:@olli/kvdex/encoding/brotli"
 *
 * // With brotli compression
 * const encoder = jsonEncoder({ compressor: brotliCompressor() })
 * ```
 *
 * @example
 * ```ts
 * import { jsonStringify, jsonParse } from "jsr:@olli/kvdex/encoding/json"
 *
 * // Stringify value
 * const json = jsonStringify({
 *   foo: "bar",
 *   big: 100n
 * })
 *
 * // Parse value
 * const value = jsonParse(json)
 * ```
 *
 * @example
 * ```ts
 * import { jsonSerialize, jsonDeserialize } from "jsr:@olli/kvdex/encoding/json"
 *
 * // Serialize value as Uint8Array
 * const serialized = jsonSerialize({
 *   foo: "bar",
 *   big: 100n
 * })
 *
 * // Deserialize value from Uint8Array
 * const value = jsonDeserialize(serialized)
 * ```
 */

export { jsonEncoder } from "./json_encoder.ts";
export {
    jsonDeserialize,
    jsonParse,
    jsonSerialize,
    jsonStringify,
} from "./utils.ts";
export type * from "./types.ts";
