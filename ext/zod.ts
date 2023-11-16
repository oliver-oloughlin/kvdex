import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"
import type {
  KeysOfThatDontExtend,
  KeysOfThatExtend,
  KvArray,
  KvObject,
  KvValue,
  Model,
} from "../mod.ts"

/*******************/
/*                 */
/*     SCHEMAS     */
/*                 */
/*******************/
const LazyKvValueSchema = z.lazy(() => KvValueSchema)

const LazyKvArraySchema = z.lazy(() => KvArraySchema)

const LazyKvObjectSchema = z.lazy(() => KvObjectSchema)

export const KvIdSchema = z.string()
  .or(z.number())
  .or(z.bigint())
  .or(z.boolean())
  .or(z.instanceof(Uint8Array))

export const KvValueSchema: z.ZodType<KvValue> = z.undefined()
  .or(z.null())
  .or(z.string())
  .or(z.number())
  .or(z.boolean())
  .or(z.bigint())
  .or(z.instanceof(Deno.KvU64))
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
  .or(z.instanceof(Float32Array))
  .or(z.instanceof(Float64Array))
  .or(z.instanceof(ArrayBuffer))
  .or(z.date())
  .or(z.set(LazyKvValueSchema))
  .or(z.map(LazyKvValueSchema, LazyKvValueSchema))
  .or(z.instanceof(RegExp))
  .or(z.instanceof(DataView))
  .or(z.instanceof(Error))

export const KvArraySchema: z.ZodType<KvArray> = z.array(KvValueSchema)

export const KvObjectSchema: z.ZodType<KvObject> = z.record(
  z.string().or(z.number()),
  KvValueSchema,
)

/*****************/
/*               */
/*     TYPES     */
/*               */
/*****************/

export type ZodInputModel<T extends z.ZodType<KvValue>> = T extends
  z.ZodDefault<infer Z extends z.ZodType> ? (
    (
      Z extends z.ZodObject<z.ZodRawShape> ? ZodInputModel<Z>
        : z.TypeOf<Z>
    ) | undefined
  )
  : T extends z.ZodObject<infer U> ? ZodObjectInputModel<U>
  : z.TypeOf<T>

export type ZodObjectInputModel<T extends z.ZodRawShape> =
  & {
    [K in KeysOfThatExtend<T, z.ZodDefault<z.ZodType>>]?: ZodInputModel<
      T[K]
    >
  }
  & {
    [K in KeysOfThatDontExtend<T, z.ZodDefault<z.ZodType>>]: ZodInputModel<
      T[K]
    >
  }

/*****************/
/*               */
/*   FUNCTIONS   */
/*               */
/*****************/

/**
 * Create a model from a Zod schema.
 *
 * Correctly parses the input model from the given schema.
 *
 * @example
 * ```ts
 * import { z } from "https://deno.land/x/zod/mod.ts"
 * import { zodModel } from "https://deno.land/x/kvdex/ext/zod.ts"
 * import { collection, kvdex } from "https://deno.land/x/kvdex/mod.ts"
 *
 * const UserSchema = z.object({
 *   username: z.string(),
 *   gender: z.string().default("not given"),
 * })
 *
 * const kv = await Deno.openKv()
 *
 * const db = kvdex(kv, {
 *   users_basic: collection(UserSchema),
 *   users_zod: collection(zodModel(UserSchema)),
 * })
 *
 * // Produces a type error for missing "gender" field.
 * const result = await db.users_basic.add({
 *   username: "oliver",
 * })
 *
 * // No type error for missing "gender" field.
 * const result = await db.users_zod.add({
 *   username: "oliver",
 * })
 * ```
 *
 * @param schema - Zod schema.
 * @returns A model with inferred input and output types.
 */
export function zodModel<const T extends z.ZodType<KvValue>>(
  schema: T,
): Model<ZodInputModel<T>, z.infer<T>> {
  return {
    parse: (data) => schema.parse(data),
  }
}
