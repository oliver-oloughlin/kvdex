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
export function model<const TInput extends KvValue>(): Model<TInput, TInput> {
  return {
    parse: (value) => value as TInput,
  }
}

/**
 * Create a standard async model with parse transformation without data validation.
 *
 * Transforms data upon parsing, while simply type casting the output value when validating.
 *
 * @example
 * ```ts
 * type User = {
 *   username: string
 *   age: number
 *   createdAt: Date
 * }
 *
 * type UserInput = Omit<User, "createdAt">
 *
 * // Adds the "createdAt" field when parsing user input data
 * const UserModel = asyncModel((input: UserInput) => ({
 *   createdAt: new Date(),
 *   ...input,
 * }) as User)
 * ```
 *
 * @param transform - Transform function from input data to output data.
 * @returns - An async model that transforms input values upon parsing.
 */
export function asyncModel<const TOutput extends KvValue, const TInput>(
  transform: (input: TInput) => TOutput,
): Model<TOutput, TInput> {
  return {
    parse: (data) => transform(data),
    __validate: (data) => data as TOutput,
  }
}
