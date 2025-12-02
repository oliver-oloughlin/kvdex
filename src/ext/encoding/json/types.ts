import type { Compressor } from "../../../core/types.ts";

/** Options for JSON encoding. */
export type JsonEncoderOptions = {
  /** Optional compressor object. */
  compressor?: Compressor;
};
