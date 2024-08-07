import type {
  DenoAtomicCheck,
  DenoAtomicOperation,
  DenoKvCommitError,
  DenoKvCommitResult,
  DenoKvEnqueueOptions,
  DenoKvSetOptions,
  DenoKvStrictKey,
} from "../../src/types.ts"
import type { KvMap } from "./kv_map.ts"

export class KvMapAtomicOperation implements DenoAtomicOperation {
  private map: KvMap

  constructor(map: KvMap) {
    this.map = map
  }
  set(
    key: DenoKvStrictKey,
    value: unknown,
    options?: DenoKvSetOptions,
  ): DenoAtomicOperation {
    throw new Error("Method not implemented.")
  }
  delete(key: DenoKvStrictKey): DenoAtomicOperation {
    throw new Error("Method not implemented.")
  }
  min(key: DenoKvStrictKey, n: bigint): DenoAtomicOperation {
    throw new Error("Method not implemented.")
  }
  max(key: DenoKvStrictKey, n: bigint): DenoAtomicOperation {
    throw new Error("Method not implemented.")
  }
  sum(key: DenoKvStrictKey, n: bigint): DenoAtomicOperation {
    throw new Error("Method not implemented.")
  }
  check(...checks: DenoAtomicCheck[]): DenoAtomicOperation {
    throw new Error("Method not implemented.")
  }
  enqueue(value: unknown, options?: DenoKvEnqueueOptions): DenoAtomicOperation {
    throw new Error("Method not implemented.")
  }
  commit():
    | Promise<DenoKvCommitError | DenoKvCommitResult>
    | DenoKvCommitError
    | DenoKvCommitResult {
    throw new Error("Method not implemented.")
  }
}
