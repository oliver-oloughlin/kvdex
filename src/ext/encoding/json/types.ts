import type { Compressor } from "../../../types.ts";

/** Options for JSON encoding. */
export type JsonEncoderOptions = {
    /** Optional compressor object. */
    compressor?: Compressor;
};
