import type { AtomicSetOptions } from "./types.ts"

/** Holds atomic mutations in a pool until bound to an actual atomic operation */
export class AtomicPool implements Deno.AtomicOperation {
  private pool: Array<(op: Deno.AtomicOperation) => Deno.AtomicOperation>

  constructor() {
    this.pool = []
  }

  set(key: Deno.KvKey, value: unknown, options?: AtomicSetOptions) {
    this.pool.push((op) => op.set(key, value, options))
    return this
  }

  delete(key: Deno.KvKey) {
    this.pool.push((op) => op.delete(key))
    return this
  }

  mutate(...mutations: Deno.KvMutation[]) {
    this.pool.push((op) => op.mutate(...mutations))
    return this
  }

  check(...checks: Deno.AtomicCheck[]) {
    this.pool.push((op) => op.check(...checks))
    return this
  }

  sum(key: Deno.KvKey, n: bigint) {
    this.pool.push((op) => op.sum(key, n))
    return this
  }

  max(key: Deno.KvKey, n: bigint) {
    this.pool.push((op) => op.max(key, n))
    return this
  }

  min(key: Deno.KvKey, n: bigint): this {
    this.pool.push((op) => op.min(key, n))
    return this
  }

  enqueue(
    value: unknown,
    options?: {
      delay?: number | undefined
      keysIfUndelivered?: Deno.KvKey[] | undefined
    } | undefined,
  ) {
    this.pool.push((op) => op.enqueue(value, options))
    return this
  }

  commit(): Promise<Deno.KvCommitResult | Deno.KvCommitError> {
    throw Error("Not Implemented")
  }

  bindTo(atomic: Deno.AtomicOperation) {
    this.pool.forEach((mutation) => mutation(atomic))
  }
}
