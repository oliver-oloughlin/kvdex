/**
 * @module # Brotli Sync
 *
 * Easy to configure synchronous brotli compression for use with the `encoder` option for collections.
 *
 * Relies on the `node:zlib` built-in.
 *
 * @example
 * ```ts
 * import { brotliCompressorSync } from "@olli/kvdex/encoding/brotli-sync"
 *
 * // With default options
 * const compressor = brotliCompressorSync()
 *
 * // Explicitly set quality level (default is 1)
 * const compressor = brotliCompressorSync({ quality: 2 })
 * ```
 */

export { brotliCompressorSync } from "./brotli_compressor_sync.ts";
export type * from "./types.ts";
