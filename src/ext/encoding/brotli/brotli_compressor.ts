import type { Compressor } from "../../../types.ts";
import { brotliCompress, brotliDecompress, constants } from "node:zlib";
import type { BrotliCompressorOptions } from "./types.ts";

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

  compress(data: Uint8Array): Promise<Uint8Array> {
    const { promise, resolve, reject } = Promise.withResolvers<Uint8Array>();

    brotliCompress(data, {
      params: { [constants.BROTLI_PARAM_QUALITY]: this.quality },
    }, (err, result) => {
      if (err) {
        reject(err);
      }

      resolve(new Uint8Array(result));
    });

    return promise;
  }

  decompress(data: Uint8Array): Promise<Uint8Array> {
    const { promise, resolve, reject } = Promise.withResolvers<Uint8Array>();

    brotliDecompress(data, {
      params: { [constants.BROTLI_PARAM_QUALITY]: this.quality },
    }, (err, result) => {
      if (err) {
        reject(err);
      }

      resolve(new Uint8Array(result));
    });

    return promise;
  }
}
