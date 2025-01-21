import type {
  DenoAtomicCheck,
  DenoAtomicOperation,
  DenoKvCommitError,
  DenoKvCommitResult,
  DenoKvEnqueueOptions,
  DenoKvSetOptions,
  DenoKvStrictKey,
} from "../../types.ts";
import { allFulfilled } from "../../utils.ts";
import type { AsyncLock } from "./async_lock.ts";
import type { MapKv } from "./map_kv.ts";
import { createVersionstamp } from "./utils.ts";

export class MapKvAtomicOperation implements DenoAtomicOperation {
  private kv: MapKv;
  private lock: AsyncLock;
  private checks: (() => Promise<boolean>)[];
  private ops: ((versionstamp: string) => Promise<void>)[];

  constructor(kv: MapKv, lock: AsyncLock) {
    this.kv = kv;
    this.lock = lock;
    this.checks = [];
    this.ops = [];
  }

  set(
    key: DenoKvStrictKey,
    value: unknown,
    options?: DenoKvSetOptions,
  ): DenoAtomicOperation {
    this.ops.push(async (versionstamp) => {
      await this.kv._set(key, value, versionstamp, options);
    });
    return this;
  }

  delete(key: DenoKvStrictKey): DenoAtomicOperation {
    this.ops.push(() => this.kv.delete(key));
    return this;
  }

  min(key: DenoKvStrictKey, n: bigint): DenoAtomicOperation {
    this.ops.push(async (versionstamp) => {
      const { value } = await this.kv.get(key);
      if (!value) {
        await this.kv._set(key, { value: n }, versionstamp);
        return;
      }

      const val = (value as any).value;
      if (typeof val !== "bigint") {
        throw new Error("Min operation can only be performed on KvU64 value");
      }

      await this.kv._set(key, {
        value: n < val ? n : val,
      }, versionstamp);
    });

    return this;
  }

  max(key: DenoKvStrictKey, n: bigint): DenoAtomicOperation {
    this.ops.push(async (versionstamp) => {
      const { value } = await this.kv.get(key);
      if (!value) {
        await this.kv._set(key, { value: n }, versionstamp);
        return;
      }

      const val = (value as any).value;
      if (typeof val !== "bigint") {
        throw new Error("Max operation can only be performed on KvU64 value");
      }

      await this.kv._set(key, {
        value: n > val ? n : val,
      }, versionstamp);
    });

    return this;
  }

  sum(key: DenoKvStrictKey, n: bigint): DenoAtomicOperation {
    this.ops.push(async (versionstamp) => {
      const { value } = await this.kv.get(key);
      if (!value) {
        await this.kv._set(key, { value: n }, versionstamp);
        return;
      }

      const val = (value as any).value;
      if (typeof val !== "bigint") {
        throw new Error("Sum operation can only be performed on KvU64 value");
      }

      await this.kv._set(key, {
        value: n + val,
      }, versionstamp);
    });

    return this;
  }

  check(...checks: DenoAtomicCheck[]): DenoAtomicOperation {
    checks.forEach(({ key, versionstamp }) => {
      this.checks.push(async () => {
        const entry = await this.kv.get(key);
        return entry.versionstamp === versionstamp;
      });
    });

    return this;
  }

  enqueue(value: unknown, options?: DenoKvEnqueueOptions): DenoAtomicOperation {
    this.ops.push(async (versionstamp) => {
      await this.kv._enqueue(value, versionstamp, options);
    });

    return this;
  }

  async commit(): Promise<DenoKvCommitError | DenoKvCommitResult> {
    await this.lock.lock();

    const checks = await Promise.allSettled(
      this.checks.map((check) => check()),
    );

    const passedChecks = checks.every((checkResult) =>
      checkResult.status === "fulfilled" && checkResult.value
    );

    if (!passedChecks) {
      return {
        ok: false,
      };
    }

    const versionstamp = createVersionstamp();
    await allFulfilled(this.ops.map((op) => op(versionstamp)));

    this.lock.release();

    return {
      ok: true,
      versionstamp,
    };
  }
}
