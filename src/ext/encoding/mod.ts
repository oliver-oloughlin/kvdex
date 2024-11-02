/**
 * @module # Encoding
 *
 * Utilities for encoding data.
 *
 * @module ## JSON
 *
 * JSON-encoder and utilities for stringifying and serializing data.
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
 *
 * @module ## V8
 *
 * V8-encoder and serialization utilities.
 *
 * Relies on the `node:v8` built-in.
 *
 * @example
 * ```ts
 * import { v8Encoder } from "jsr:@olli/kvdex/encoding/v8"
 * import { brotliCompressor } from "jsr:@olli/kvdex/encoding/brotli"
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
 * import { v8Serialize, v8Deserialize } from "jsr:@olli/kvdex/encoding/v8"
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
 *
 * @module ## Brotli
 *
 * Easy to configure brotli compression for use with the `encoder` option for collections.
 *
 * Relies on the `node:zlib` built-in.
 *
 * @example
 * ```ts
 * import { brotliCompressor } from "jsr:@olli/kvdex/encoding/brotli"
 *
 * // With default options
 * const compressor = brotliCompressor()
 *
 * // Explicitly set quality level (default is 1)
 * const compressor = brotliCompressor({ quality: 2 })
 * ```
 */

export * from "./brotli/mod.ts";
export * from "./json/mod.ts";
export * from "./v8/mod.ts";
