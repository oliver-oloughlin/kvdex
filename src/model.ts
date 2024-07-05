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
  const TOutput extends KvValue,
  const TInput = TOutput,
>(
  transform?: (data: TInput) => TOutput,
): Model<TInput, TOutput> {
  return {
    parse: (data) => data as TOutput,
    _transform: transform,
    _input: null as TInput,
  }
}
