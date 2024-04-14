import {
  ATOMIC_OPERATION_MUTATION_LIMIT,
  ATOMIC_OPERATION_SIZE_LIMIT,
  ATOMIC_OPERTION_CHECK_LIMIT,
} from "./constants.ts"
import type {
  AtomicSetOptions,
  DenoAtomicCheck,
  DenoAtomicOperation,
  DenoKv,
  DenoKvCommitError,
  DenoKvCommitResult,
  DenoKvStrictKey,
} from "./types.ts"

/**
 * Implements the AtomicOperation interface and automatically executes
 * batched operations using a dynamic attributes such as count and size.
 */
export class AtomicWrapper implements DenoAtomicOperation {
  private kv: DenoKv
  private atomics: DenoAtomicOperation[]
  private currentAtomic: DenoAtomicOperation
  private currentCount: number
  private currentCheckCount: number
  private currentSize: number

  constructor(kv: DenoKv) {
    this.kv = kv
    this.atomics = []
    this.currentAtomic = kv.atomic()
    this.currentCount = 0
    this.currentCheckCount = 0
    this.currentSize = 0
  }

  set(key: DenoKvStrictKey, value: unknown, options?: AtomicSetOptions) {
    this.addMutation((op) => op.set(key, value, options), 67, false)
    return this
  }

  delete(key: DenoKvStrictKey) {
    this.addMutation((op) => op.delete(key), 3, false)
    return this
  }

  check(...checks: DenoAtomicCheck[]) {
    checks.forEach((check) =>
      this.addMutation((op) => op.check(check), 3, true)
    )
    return this
  }

  sum(key: DenoKvStrictKey, n: bigint) {
    this.addMutation((op) => op.sum(key, n), 3, false)
    return this
  }

  max(key: DenoKvStrictKey, n: bigint) {
    this.addMutation((op) => op.max(key, n), 3, false)
    return this
  }

  min(key: DenoKvStrictKey, n: bigint): this {
    this.addMutation((op) => op.min(key, n), 3, false)
    return this
  }

  enqueue(
    value: unknown,
    options?: {
      delay?: number | undefined
      keysIfUndelivered?: DenoKvStrictKey[] | undefined
    } | undefined,
  ) {
    this.addMutation((op) => op.enqueue(value, options), 96, false)
    return this
  }

  async commit(): Promise<DenoKvCommitResult | DenoKvCommitError> {
    // Add curent operation to atomics list
    if (this.currentCount > 0) {
      this.atomics.push(this.currentAtomic)
    }

    // Commit all operations
    const settled = await Promise.allSettled(
      this.atomics.map((op) => op.commit()),
    )

    // Check status of all commits
    const success = settled.every((v) => v.status === "fulfilled" && v.value.ok)

    // If successful, return commit result
    if (success) {
      return {
        ok: true,
        versionstamp: (settled.at(0) as any)?.value.versionstamp ?? "0",
      }
    }

    // Return commit error
    return {
      ok: false,
    }
  }

  /** PRIVATE METHODS */

  /**
   * Add an atomic mutation within a batched operation.
   *
   * @param mutation - Atomic mutation.
   */
  private addMutation(
    mutation: (op: DenoAtomicOperation) => DenoAtomicOperation,
    size: number,
    isCheck: boolean,
  ) {
    this.currentSize += size
    this.currentCount++

    if (isCheck) {
      this.currentCheckCount++
    }

    if (
      this.currentCount > ATOMIC_OPERATION_MUTATION_LIMIT ||
      this.currentSize > ATOMIC_OPERATION_SIZE_LIMIT ||
      this.currentCheckCount > ATOMIC_OPERTION_CHECK_LIMIT
    ) {
      this.atomics.push(this.currentAtomic)
      this.currentAtomic = this.kv.atomic()
      this.currentCount = 0
      this.currentCheckCount = 0
      this.currentSize = 0
    }

    mutation(this.currentAtomic)
  }
}
