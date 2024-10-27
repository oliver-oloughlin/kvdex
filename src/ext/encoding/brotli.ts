import type { Compressor } from "../../types.ts";
import { brotliCompressSync, brotliDecompressSync, constants } from "node:zlib";

export type BrotliCompressorOptions = {
  /**
   * Brolti compression quality.
   *
   * @default 1
   */
  quality?: number;
};

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

  decompress(compressedData: Uint8Array) {
    const buffer = brotliDecompressSync(compressedData, {
      params: { [constants.BROTLI_PARAM_QUALITY]: this.quality },
    });

    return new Uint8Array(buffer);
  }
}
