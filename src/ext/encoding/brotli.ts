import type { Compressor } from "../../types.ts";
import { brotliCompressSync, brotliDecompressSync, constants } from "node:zlib";

/** Options for brotli compression. */
export type BrotliCompressorOptions = {
  /**
   * Brolti compression quality.
   *
   * @default 1
   */
  quality?: number;
};

/**
 * Brotli compressor.
 *
 * Used for compressing and compressing data represented as a Uint8Array.
 *
 * @param options - Brolti compression options.
 * @returns - A Compressor object.
 */
export function brotliCompressor(
  options?: BrotliCompressorOptions,
): Compressor {
  return new BrotliCompressor(options?.quality);
}

class BrotliCompressor implements Compressor {
  private quality;

  constructor(quality: number = 1) {
    this.quality = quality;
  }

  compress(data: Uint8Array) {
    const buffer = brotliCompressSync(data, {
      params: { [constants.BROTLI_PARAM_QUALITY]: this.quality },
    });

    return new Uint8Array(buffer);
  }

  decompress(data: Uint8Array) {
    const buffer = brotliDecompressSync(data, {
      params: { [constants.BROTLI_PARAM_QUALITY]: this.quality },
    });

    return new Uint8Array(buffer);
  }
}
