import type {
  DenoAtomicCheck,
  DenoAtomicOperation,
  DenoKvCommitError,
  DenoKvCommitResult,
  DenoKvEnqueueOptions,
  DenoKvSetOptions,
  DenoKvStrictKey,
} from "../../src/types.ts"
import type { MapKv } from "./kv_map.ts"

export class KvMapAtomicOperation implements DenoAtomicOperation {
  private kv: MapKv
  private checks: (() => boolean)[]
  private ops: (() => void)[]

  constructor(kv: MapKv) {
    this.kv = kv
    this.checks = []
    this.ops = []
  }

  set(
    key: DenoKvStrictKey,
    value: unknown,
    options?: DenoKvSetOptions,
  ): DenoAtomicOperation {
    this.ops.push(() => this.kv.set(key, value, options))
    return this
  }

  delete(key: DenoKvStrictKey): DenoAtomicOperation {
    this.ops.push(() => this.kv.delete(key))
    return this
  }

  min(key: DenoKvStrictKey, n: bigint): DenoAtomicOperation {
    this.ops.push(() => {
      const { value } = this.kv.get(key)
      if (!value) {
        this.kv.set(key, { value: n })
        return
      }

      const val = (value as any).value
      if (typeof val !== "bigint") {
        throw new Error("Min operation can only be performed on KvU64 value")
      }

      this.kv.set(key, {
        value: n < val ? n : val,
      })
    })

    return this
  }

  max(key: DenoKvStrictKey, n: bigint): DenoAtomicOperation {
    this.ops.push(() => {
      const { value } = this.kv.get(key)
      if (!value) {
        this.kv.set(key, { value: n })
        return
      }

      const val = (value as any).value
      if (typeof val !== "bigint") {
        throw new Error("Max operation can only be performed on KvU64 value")
      }

      this.kv.set(key, {
        value: n > val ? n : val,
      })
    })

    return this
  }

  sum(key: DenoKvStrictKey, n: bigint): DenoAtomicOperation {
    this.ops.push(() => {
      const { value } = this.kv.get(key)
      if (!value) {
        this.kv.set(key, { value: n })
        return
      }

      const val = (value as any).value
      if (typeof val !== "bigint") {
        throw new Error("Sum operation can only be performed on KvU64 value")
      }

      this.kv.set(key, {
        value: n + val,
      })
    })

    return this
  }

  check(...checks: DenoAtomicCheck[]): DenoAtomicOperation {
    checks.forEach(({ key, versionstamp }) => {
      this.checks.push(() => {
        const entry = this.kv.get(key)
        return entry.versionstamp === versionstamp
      })
    })

    return this
  }

  enqueue(value: unknown, options?: DenoKvEnqueueOptions): DenoAtomicOperation {
    this.ops.push(() => {
      this.kv.enqueue(value, options)
    })

    return this
  }

  commit(): DenoKvCommitError | DenoKvCommitResult {
    const passedChecks = this.checks
      .map((check) => check())
      .every((check) => check)

    if (!passedChecks) {
      return {
        ok: false,
      }
    }

    this.ops.forEach((op) => op())

    return {
      ok: true,
      versionstamp: this.kv._versionstamp,
    }
  }
}
