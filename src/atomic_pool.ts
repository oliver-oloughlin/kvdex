import type {
  DenoAtomicCheck,
  DenoAtomicOperation,
  DenoKvCommitError,
  DenoKvCommitResult,
  DenoKvSetOptions,
  DenoKvStrictKey,
} from "./types.ts";

/** Holds atomic mutations in a pool until bound to an actual atomic operation */
export class AtomicPool implements DenoAtomicOperation {
  private pool: Array<(op: DenoAtomicOperation) => DenoAtomicOperation>;

  constructor() {
    this.pool = [];
  }

  set(key: DenoKvStrictKey, value: unknown, options?: DenoKvSetOptions) {
    this.pool.push((op) => op.set(key, value, options));
    return this;
  }

  delete(key: DenoKvStrictKey) {
    this.pool.push((op) => op.delete(key));
    return this;
  }

  check(...checks: DenoAtomicCheck[]) {
    this.pool.push((op) => op.check(...checks));
    return this;
  }

  sum(key: DenoKvStrictKey, n: bigint) {
    this.pool.push((op) => op.sum(key, n));
    return this;
  }

  max(key: DenoKvStrictKey, n: bigint) {
    this.pool.push((op) => op.max(key, n));
    return this;
  }

  min(key: DenoKvStrictKey, n: bigint): this {
    this.pool.push((op) => op.min(key, n));
    return this;
  }

  enqueue(
    value: unknown,
    options?: {
      delay?: number | undefined;
      keysIfUndelivered?: DenoKvStrictKey[];
    },
  ) {
    this.pool.push((op) => op.enqueue(value, options));
    return this;
  }

  commit(): Promise<DenoKvCommitResult | DenoKvCommitError> {
    throw Error("Not Implemented");
  }

  bindTo(atomic: DenoAtomicOperation) {
    this.pool.forEach((mutation) => mutation(atomic));
  }
}
