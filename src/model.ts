import type { KvValue, Model } from "./types.ts"

/**
 * Create a standard model without data validation.
 *
 * Optionally provide a transform function.
 *
 * @example
 * ```ts
 * type User = {
 *   username: string
 *   age: number
 *   createdAt: Date
 * }
 *
 * // Normal model
 * const UserModel = model<User>()
 *
 * // Transform model
 * const UserModel = model<Omit<User, "createdAt">, User>((user) => ({
 *   ...user,
 *   createdAt: new Date()
 * }))
 * ```
 *
 * @param transform - Transform function mapping from input data to output data.
 * @returns A standard model.
 */
export function model<
  const TInput = unknown,
  const TOutput extends KvValue = TInput extends KvValue ? TInput : KvValue,
>(
  transform?: (data: TInput) => TOutput,
): Model<TInput, TOutput> {
  if (transform) {
    return {
      parse: (data) => transform(data),
      __validate: (data) => data as TOutput,
    }
  }

  return {
    parse: (value) => value as unknown as TOutput,
  }
}
