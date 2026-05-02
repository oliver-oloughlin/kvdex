import {
  ATOMIC_OPERATION_KEY_SIZE_LIMIT,
  ATOMIC_OPERATION_MUTATION_LIMIT,
  ATOMIC_OPERATION_SIZE_LIMIT,
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
import { commitAtomicOperations } from "./utils.ts";

type PreparedMutation = {
  mutation: (op: DenoAtomicOperation) => DenoAtomicOperation;
  size: number;
  keySize: number;
};

/**
 * Implements the AtomicOperation interface and automatically executes
 * batched operations using dynamic attributes such as count and size.
 *
 * Check operations are still subject to the same max count limit as a single operation,
 * as they need to be duplicated across each operation.
 */
export class AtomicWrapper implements DenoAtomicOperation {
  private kv: DenoKv;
  private atomics: DenoAtomicOperation[];
  private currentAtomic: DenoAtomicOperation;
  private currentCount: number;
  private currentSize: number;
  private currentKeySize: number;
  private mutations: PreparedMutation[];
  private checks: PreparedMutation[];

  constructor(kv: DenoKv) {
    this.kv = kv;
    this.atomics = [];
    this.currentAtomic = kv.atomic();
    this.currentCount = 0;
    this.currentSize = 0;
    this.currentKeySize = 0;
    this.mutations = [];
    this.checks = [];
  }

  set(key: DenoKvStrictKey, value: unknown, options?: DenoKvSetOptions): this {
    this.mutations.push({
      mutation: (op) => op.set(key, value, options),
      size: 67,
      keySize: 2,
    });

    return this;
  }

  delete(key: DenoKvStrictKey): this {
    this.mutations.push({
      mutation: (op) => op.delete(key),
      size: 3,
      keySize: 2,
    });

    return this;
  }

  check(...checks: DenoAtomicCheck[]): this {
    checks.forEach((check) =>
      this.checks.push({
        mutation: (op) => op.check(check),
        size: 3,
        keySize: 2,
      })
    );

    return this;
  }

  sum(key: DenoKvStrictKey, n: bigint): this {
    this.mutations.push({
      mutation: (op) => op.sum(key, n),
      size: 3,
      keySize: 2,
    });

    return this;
  }

  max(key: DenoKvStrictKey, n: bigint): this {
    this.mutations.push({
      mutation: (op) => op.max(key, n),
      size: 3,
      keySize: 2,
    });

    return this;
  }

  min(key: DenoKvStrictKey, n: bigint): this {
    this.mutations.push({
      mutation: (op) => op.min(key, n),
      size: 3,
      keySize: 2,
    });

    return this;
  }

  enqueue(
    value: unknown,
    options?: {
      delay?: number | undefined;
      keysIfUndelivered?: DenoKvStrictKey[] | undefined;
    } | undefined,
  ): this {
    this.mutations.push({
      mutation: (op) => op.enqueue(value, options),
      size: 96,
      keySize: 2 + ((options?.keysIfUndelivered?.length ?? 0) * 2),
    });

    return this;
  }

  async commit(): Promise<DenoKvCommitResult | DenoKvCommitError> {
    // Apply all mutations
    this.applyMutations();

    // Commit all operations
    return await commitAtomicOperations(this.atomics);
  }

  /** PRIVATE METHODS */

  /** Apply all mutations to the atomic operations list. */
  private applyMutations(): void {
    this.mutations.forEach(({ mutation, size, keySize }) => {
      // Check if adding the mutation would exceed any of the limits for the current atomic operation
      if (
        this.currentCount + 1 > ATOMIC_OPERATION_MUTATION_LIMIT ||
        this.currentSize + size > ATOMIC_OPERATION_SIZE_LIMIT ||
        this.currentKeySize + keySize > ATOMIC_OPERATION_KEY_SIZE_LIMIT
      ) {
        this.atomics.push(this.currentAtomic);
        this.currentAtomic = this.kv.atomic();
        this.currentCount = 0;
        this.currentSize = 0;
        this.currentKeySize = 0;
      }

      // Add any check operations if this is a new atomic operation
      if (this.currentCount === 0) {
        this.checks.forEach((check) => {
          check.mutation(this.currentAtomic);
          this.currentSize += check.size;
          this.currentKeySize += check.keySize;
          this.currentCount++;
        });
      }

      // Add the mutation to the current atomic operation
      mutation(this.currentAtomic);
      this.currentSize += size;
      this.currentKeySize += keySize;
      this.currentCount++;
    });

    // Add the curent operation to the atomics list
    if (this.currentCount > 0) {
      this.atomics.push(this.currentAtomic);
    }
  }
}
