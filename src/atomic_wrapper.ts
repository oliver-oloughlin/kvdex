import { ATOMIC_OPERATION_MUTATION_LIMIT } from "./constants.ts"
import type { SetOptions } from "./types.ts"
import { clamp } from "./utils.ts"

export class AtomicWrapper implements Deno.AtomicOperation {
  private kv: Deno.Kv
  private current: Deno.AtomicOperation
  private atomics: Deno.AtomicOperation[]
  private count: number
  private atomicBatchSize: number

  constructor(
    kv: Deno.Kv,
    atomicBatchSize = ATOMIC_OPERATION_MUTATION_LIMIT / 4,
  ) {
    this.kv = kv
    this.current = kv.atomic()
    this.atomics = []
    this.count = 0
    this.atomicBatchSize = clamp(
      1,
      atomicBatchSize,
      ATOMIC_OPERATION_MUTATION_LIMIT,
    )
  }

  set(key: Deno.KvKey, value: unknown, options?: SetOptions) {
    this.addMutation((op) => op.set(key, value, options))
    return this
  }

  delete(key: Deno.KvKey) {
    this.addMutation((op) => op.delete(key))
    return this
  }

  mutate(...mutations: Deno.KvMutation[]) {
    this.addMutation((op) => op.mutate(...mutations))
    return this
  }

  check(...checks: Deno.AtomicCheck[]) {
    this.addMutation((op) => op.check(...checks))
    return this
  }

  sum(key: Deno.KvKey, n: bigint) {
    this.addMutation((op) => op.sum(key, n))
    return this
  }

  max(key: Deno.KvKey, n: bigint) {
    this.addMutation((op) => op.max(key, n))
    return this
  }

  min(key: Deno.KvKey, n: bigint): this {
    this.addMutation((op) => op.min(key, n))
    return this
  }

  enqueue(
    value: unknown,
    options?: {
      delay?: number | undefined
      keysIfUndelivered?: Deno.KvKey[] | undefined
    } | undefined,
  ) {
    this.addMutation((op) => op.enqueue(value, options))
    return this
  }

  async commit(): Promise<Deno.KvCommitResult | Deno.KvCommitError> {
    // Add curent operation to atomics list
    this.atomics.push(this.current)

    // Commit all operations
    const settled = await Promise.allSettled(
      this.atomics.map((op) => op.commit()),
    )

    // Check status of all commits
    const success = settled.every((v) => v.status === "fulfilled")

    // If successful, return commit result
    if (success) {
      return {
        ok: true,
        versionstamp: "0",
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
    mutation: (op: Deno.AtomicOperation) => Deno.AtomicOperation,
  ) {
    // Add atomic mutation and increment count
    this.current = mutation(this.current)
    this.count++

    // Add current operation to atomics list if batch size is reached, reset current and count
    if (this.count % this.atomicBatchSize === this.atomicBatchSize - 1) {
      this.atomics.push(this.current)
      this.current = this.kv.atomic()
    }
  }
}
