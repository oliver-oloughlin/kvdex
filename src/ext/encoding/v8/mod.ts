/**
 * @module # V8
 *
 * V8-encoder and serialization utilities.
 *
 * Relies on the `node:v8` built-in.
 *
 * @example
 * ```ts
 * import { v8Encoder } from "@olli/kvdex/encoding/v8"
 * import { brotliCompressor } from "@olli/kvdex/encoding/brotli"
 *
 * // V8-encoder without compression
 * const encoder = v8Encoder()
 *
 * // V8-encoder with brotli compression
 * const encoder = v8Encoder({ compressor: brotliCompressor() })
 * ```
 *
 * @example
 * ```ts
 * import { v8Serialize, v8Deserialize } from "@olli/kvdex/encoding/v8"
 *
 * // Serialize value as Uint8Array
 * const serialized = v8Serialize({
 *   foo: "bar",
 *   big: 100n
 * })
 *
 * // Deserialize value from Uint8Array
 * const value = v8Deserialize(serialized)
 * ```
 */

export { v8Encoder } from "./v8_encoder.ts";
export { v8Deserialize, v8Serialize } from "./utils.ts";
export type * from "./types.ts";
