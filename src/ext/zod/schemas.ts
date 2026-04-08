import { z } from "zod";
import type {
  DenoKvStrictKeyPart,
  KvArray,
  KvId,
  KvKey,
  KvObject,
  KvValue,
} from "../../core/types.ts";

const LazyKvValueSchema = z.lazy(() => KvValueSchema);

const LazyKvArraySchema = z.lazy(() => KvArraySchema);

const LazyKvObjectSchema = z.lazy(() => KvObjectSchema);

/** Zod schema for strict KvKeyPart type (excluding symbol) */
export const KvKeyPartSchema: z.ZodType<DenoKvStrictKeyPart> = z.union([
  z.string(),
  z.number(),
  z.bigint(),
  z.boolean(),
  z.instanceof(Uint8Array),
]);

/** Zod schema for KvKey type */
export const KvKeySchema: z.ZodType<KvKey> = z.tuple([KvKeyPartSchema]).rest(
  KvKeyPartSchema,
);

/** Zod schema for KvId type */
export const KvIdSchema: z.ZodType<KvId> = z.union([
  KvKeyPartSchema,
  KvKeySchema,
]);

/** Zod schema for KvValue type */
export const KvValueSchema: z.ZodType<KvValue> = z.undefined()
  .or(z.null())
  .or(z.string())
  .or(z.number())
  .or(z.nan())
  .or(z.boolean())
  .or(z.bigint())
  .or(LazyKvObjectSchema)
  .or(LazyKvArraySchema)
  .or(z.instanceof(Int8Array))
  .or(z.instanceof(Int16Array))
  .or(z.instanceof(Int32Array))
  .or(z.instanceof(BigInt64Array))
  .or(z.instanceof(Uint8Array))
  .or(z.instanceof(Uint16Array))
  .or(z.instanceof(Uint32Array))
  .or(z.instanceof(BigUint64Array))
  .or(z.instanceof(Uint8ClampedArray))
  // TODO: .or(z.instanceof(Float16Array))
  .or(z.instanceof(Float32Array))
  .or(z.instanceof(Float64Array))
  .or(z.instanceof(ArrayBuffer))
  .or(z.date())
  .or(z.set(LazyKvValueSchema))
  .or(z.map(LazyKvValueSchema, LazyKvValueSchema))
  .or(z.instanceof(RegExp))
  .or(z.instanceof(DataView))
  .or(z.instanceof(Error));

/** Zod schema for KvArray type */
export const KvArraySchema: z.ZodType<KvArray> = z.array(KvValueSchema);

/** Zod schema for KvObject type */
export const KvObjectSchema: z.ZodType<KvObject> = z.record(
  z.string().or(z.number()),
  KvValueSchema,
);
