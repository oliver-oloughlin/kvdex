import type { Compressor } from "../../../core/types.ts";

/** Options for V8 encoding. */
export type V8EncoderOptions = {
  /** Optional compressor object. */
  compressor?: Compressor;
};
