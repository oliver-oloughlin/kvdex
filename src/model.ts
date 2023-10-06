import { KvValue } from "./types.ts"

export function model<T extends KvValue>() {
  return new Model<T>()
}

export class Model<_T extends KvValue> {}
