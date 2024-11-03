/**
 * @module # Brotli
 *
 * Easy to configure brotli compression for use with the `encoder` option for collections.
 *
 * Relies on the `node:zlib` built-in.
 *
 * @example
 * ```ts
 * import { brotliCompressor } from "@olli/kvdex/encoding/brotli"
 *
 * // With default options
 * const compressor = brotliCompressor()
 *
 * // Explicitly set quality level (default is 1)
 * const compressor = brotliCompressor({ quality: 2 })
 * ```
 */

export { brotliCompressor } from "./brotli_compressor.ts";
export type * from "./types.ts";
