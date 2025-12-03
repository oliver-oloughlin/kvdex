import type { Compressor } from "../../../core/types.ts";
import { brotliCompressSync, brotliDecompressSync, constants } from "node:zlib";
import type { BrotliCompressorSyncOptions } from "./types.ts";

/**
 * Synchronous brotli compressor.
 *
 * Used for compressing and decompressing data represented as a Uint8Array.
 *
 * @param options - Brolti compression options.
 * @returns - A Compressor object.
 */
export function brotliCompressorSync(
  options?: BrotliCompressorSyncOptions,
): Compressor {
  return new BrotliCompressorSync(options?.quality);
}

class BrotliCompressorSync implements Compressor {
  private quality;

  constructor(quality: number = 1) {
    this.quality = quality;
  }

  compress(data: Uint8Array): Uint8Array {
    const result = brotliCompressSync(data, {
      params: { [constants.BROTLI_PARAM_QUALITY]: this.quality },
    });

    return new Uint8Array(result);
  }

  decompress(data: Uint8Array): Uint8Array {
    const result = brotliDecompressSync(data, {
      params: { [constants.BROTLI_PARAM_QUALITY]: this.quality },
    });

    return new Uint8Array(result);
  }
}
