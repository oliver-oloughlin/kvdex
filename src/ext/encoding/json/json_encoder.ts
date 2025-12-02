import type { Encoder } from "../../../core/types.ts";
import type { JsonEncoderOptions } from "./types.ts";
import { jsonDeserialize, jsonSerialize } from "./utils.ts";

/**
 * JSON-encoder.
 *
 * Used for serializing and deserializing data as Uint8Array.
 *
 * @param options - JSON encoding options.
 * @returns - An Encoder object.
 */
export function jsonEncoder(options?: JsonEncoderOptions): Encoder {
  return {
    serializer: {
      serialize: jsonSerialize,
      deserialize: jsonDeserialize,
    },
    compressor: options?.compressor,
  };
}
