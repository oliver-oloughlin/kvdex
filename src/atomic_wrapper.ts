import {
  ATOMIC_OPERATION_MUTATION_LIMIT,
  ATOMIC_OPERATION_SIZE_LIMIT,
  ATOMIC_OPERTION_CHECK_LIMIT,
} from "./constants.ts"
import type { AtomicSetOptions } from "./types.ts"

/**
 * Implements the AtomicOperation interface and automatically executes
 * batched operations using a dynamic attributes such as count and size.
 */
export class AtomicWrapper implements Deno.AtomicOperation {
  private kv: Deno.Kv
  private atomics: Deno.AtomicOperation[]
  private currentAtomic: Deno.AtomicOperation
  private currentCount: number
  private currentCheckCount: number
  private currentSize: number

  constructor(kv: Deno.Kv) {
    this.kv = kv
    this.atomics = []
    this.currentAtomic = kv.atomic()
    this.currentCount = 0
    this.currentCheckCount = 0
    this.currentSize = 0
  }

  set(key: Deno.KvKey, value: unknown, options?: AtomicSetOptions) {
    this.addMutation((op) => op.set(key, value, options), 67, false)
    return this
  }

  delete(key: Deno.KvKey) {
    this.addMutation((op) => op.delete(key), 3, false)
    return this
  }

  mutate(...mutations: Deno.KvMutation[]) {
    mutations.forEach((mut) => {
      switch (mut.type) {
        case "delete": {
          this.delete(mut.key)
          break
        }
        case "max": {
          this.max(mut.key, mut.value.value)
          break
        }
        case "min": {
          this.min(mut.key, mut.value.value)
          break
        }
        case "sum": {
          this.sum(mut.key, mut.value.value)
          break
        }
        case "set": {
          this.set(mut.key, mut.value)
          break
        }
      }
    })

    return this
  }

  check(...checks: Deno.AtomicCheck[]) {
    checks.forEach((check) =>
      this.addMutation((op) => op.check(check), 3, true)
    )
    return this
  }

  sum(key: Deno.KvKey, n: bigint) {
    this.addMutation((op) => op.sum(key, n), 3, false)
    return this
  }

  max(key: Deno.KvKey, n: bigint) {
    this.addMutation((op) => op.max(key, n), 3, false)
    return this
  }

  min(key: Deno.KvKey, n: bigint): this {
    this.addMutation((op) => op.min(key, n), 3, false)
    return this
  }

  enqueue(
    value: unknown,
    options?: {
      delay?: number | undefined
      keysIfUndelivered?: Deno.KvKey[] | undefined
    } | undefined,
  ) {
    this.addMutation((op) => op.enqueue(value, options), 96, false)
    return this
  }

  async commit(): Promise<Deno.KvCommitResult | Deno.KvCommitError> {
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
    mutation: (op: Deno.AtomicOperation) => Deno.AtomicOperation,
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
