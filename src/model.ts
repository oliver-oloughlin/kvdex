import type { KvValue, Model } from "./types.ts"

export function model<T extends KvValue>(): Model<T> {
  return {
    parse: (value) => value as T,
  }
}
