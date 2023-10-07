import type { KvValue, Model } from "./types.ts"

/**
 * Create a standard model without data validation.
 *
 * @example
 * ```ts
 * type User = {
 *   username: string
 *   age: number
 * }
 *
 * const UserModel = model<User>()
 * ```
 *
 * @returns A standard model.
 */
export function model<T extends KvValue>(): Model<T> {
  return {
    parse: (value) => value as T,
  }
}
