import type {
  TypeOf,
  ZodDefault,
  ZodObject,
  ZodRawShape,
  ZodType,
} from "https://deno.land/x/zod@v3.22.4/mod.ts"
import type {
  KeysOfThatDontExtend,
  KeysOfThatExtend,
  KvValue,
  Model,
} from "../src/types.ts"

/*****************/
/*               */
/*     TYPES     */
/*               */
/*****************/

export type ZodInsertModel<T extends ZodType<KvValue>> = T extends
  ZodDefault<infer Z extends ZodType> ? (
    (
      Z extends ZodObject<ZodRawShape> ? ZodInsertModel<Z>
        : TypeOf<Z>
    ) | undefined
  )
  : T extends ZodObject<infer U> ? ZodObjectInsertModel<U>
  : TypeOf<T>

export type ZodObjectInsertModel<T extends ZodRawShape> =
  & {
    [K in KeysOfThatExtend<T, ZodDefault<ZodType>>]?: ZodInsertModel<
      T[K]
    >
  }
  & {
    [K in KeysOfThatDontExtend<T, ZodDefault<ZodType>>]: ZodInsertModel<T[K]>
  }

/*****************/
/*               */
/*   FUNCTIONS   */
/*               */
/*****************/

/**
 * Create a model from a Zod schema.
 *
 * Correctly parses the insert model from the given schema.
 *
 * @param schema - Zod schema.
 * @returns A model with base type and insert model.
 */
export function zodModel<const T extends ZodType<KvValue>>(
  schema: T,
): Model<TypeOf<T>, ZodInsertModel<T>> {
  return {
    parse: (data) => schema.parse(data),
  }
}
