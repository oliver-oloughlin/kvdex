import {
  ATOMIC_OPERATION_KEY_SIZE_LIMIT,
  ATOMIC_OPERATION_MUTATION_LIMIT,
  ATOMIC_OPERATION_SIZE_LIMIT,
  ATOMIC_OPERTION_CHECK_LIMIT,
} from "./constants.ts";
import type {
  DenoAtomicCheck,
  DenoAtomicOperation,
  DenoKv,
  DenoKvCommitError,
  DenoKvCommitResult,
  DenoKvSetOptions,
  DenoKvStrictKey,
} from "./types.ts";

/**
 * Implements the AtomicOperation interface and automatically executes
 * batched operations using a dynamic attributes such as count and size.
 */
export class AtomicWrapper implements DenoAtomicOperation {
  private kv: DenoKv;
  private atomics: DenoAtomicOperation[];
  private currentAtomic: DenoAtomicOperation;
  private currentCount: number;
  private currentCheckCount: number;
  private currentSize: number;
  private currentKeySize: number;

  constructor(kv: DenoKv) {
    this.kv = kv;
    this.atomics = [];
    this.currentAtomic = kv.atomic();
    this.currentCount = 0;
    this.currentCheckCount = 0;
    this.currentSize = 0;
    this.currentKeySize = 0;
  }

  set(key: DenoKvStrictKey, value: unknown, options?: DenoKvSetOptions): this {
    this.addMutation((op) => op.set(key, value, options), 67, 2, false);
    return this;
  }

  delete(key: DenoKvStrictKey): this {
    this.addMutation((op) => op.delete(key), 3, 2, false);
    return this;
  }

  check(...checks: DenoAtomicCheck[]): this {
    checks.forEach((check) =>
      this.addMutation((op) => op.check(check), 3, 2, true)
    );
    return this;
  }

  sum(key: DenoKvStrictKey, n: bigint): this {
    this.addMutation((op) => op.sum(key, n), 3, 2, false);
    return this;
  }

  max(key: DenoKvStrictKey, n: bigint): this {
    this.addMutation((op) => op.max(key, n), 3, 2, false);
    return this;
  }

  min(key: DenoKvStrictKey, n: bigint): this {
    this.addMutation((op) => op.min(key, n), 3, 2, false);
    return this;
  }

  enqueue(
    value: unknown,
    options?: {
      delay?: number | undefined;
      keysIfUndelivered?: DenoKvStrictKey[] | undefined;
    } | undefined,
  ): this {
    this.addMutation(
      (op) => op.enqueue(value, options),
      96,
      2 + ((options?.keysIfUndelivered?.length ?? 0) * 2),
      false,
    );

    return this;
  }

  async commit(): Promise<DenoKvCommitResult | DenoKvCommitError> {
    // Add curent operation to atomics list
    if (this.currentCount > 0) {
      this.atomics.push(this.currentAtomic);
    }

    // Commit all operations
    const settled = await Promise.allSettled(
      this.atomics.map((op) => op.commit()),
    );

    // Check status of all commits
    const success = settled.every((v) =>
      v.status === "fulfilled" && v.value.ok
    );

    // If successful, return commit result
    if (success) {
      return {
        ok: true,
        versionstamp: (settled.at(0) as any)?.value.versionstamp ?? "0",
      };
    }

    // Return commit error
    return {
      ok: false,
    };
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
    keySize: number,
    isCheck: boolean,
  ): void {
    this.currentSize += size;
    this.currentKeySize += keySize;
    this.currentCount++;

    if (isCheck) {
      this.currentCheckCount++;
    }

    if (
      this.currentCount > ATOMIC_OPERATION_MUTATION_LIMIT ||
      this.currentSize > ATOMIC_OPERATION_SIZE_LIMIT ||
      this.currentKeySize > ATOMIC_OPERATION_KEY_SIZE_LIMIT ||
      this.currentCheckCount > ATOMIC_OPERTION_CHECK_LIMIT
    ) {
      this.atomics.push(this.currentAtomic);
      this.currentAtomic = this.kv.atomic();
      this.currentCount = 0;
      this.currentCheckCount = 0;
      this.currentSize = 0;
      this.currentKeySize = 0;
    }

    mutation(this.currentAtomic);
  }
}
