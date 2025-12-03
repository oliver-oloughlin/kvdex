import type { Encoder } from "../../../core/types.ts";
import type { V8EncoderOptions } from "./types.ts";
import { v8Deserialize, v8Serialize } from "./utils.ts";

/**
 * V8-encoder.
 *
 * Used for serializing and deserializing data as Uint8Array.
 *
 * Relies on `serialize()` and `deserialize()` from the node:v8 built-in module.
 *
 * @param options - V8 encoding options.
 * @returns - An Encoder object.
 */
export function v8Encoder(options?: V8EncoderOptions): Encoder {
  return {
    serializer: {
      serialize: v8Serialize,
      deserialize: v8Deserialize,
    },
    compressor: options?.compressor,
  };
}
