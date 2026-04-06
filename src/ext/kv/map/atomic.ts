import type {
  DenoAtomicCheck,
  DenoAtomicOperation,
  DenoKvCommitError,
  DenoKvCommitResult,
  DenoKvEnqueueOptions,
  DenoKvSetOptions,
  DenoKvStrictKey,
} from "../../../core/types.ts";
import { allFulfilled } from "../../../core/utils.ts";
import type { AsyncLock } from "./async_lock.ts";
import type { MapKv } from "./map_kv.ts";
import { createVersionstamp } from "../common/utils.ts";

export class MapKvAtomicOperation implements DenoAtomicOperation {
  private kv: MapKv;
  private asyncLock: AsyncLock;
  private checks: (() => Promise<boolean>)[];
  private ops: ((versionstamp: string) => Promise<void>)[];

  constructor(kv: MapKv, asyncLock: AsyncLock) {
    this.kv = kv;
    this.asyncLock = asyncLock;
    this.checks = [];
    this.ops = [];
  }

  set(
    key: DenoKvStrictKey,
    value: unknown,
    options?: DenoKvSetOptions,
  ): DenoAtomicOperation {
    this.ops.push(async (versionstamp) => {
      await this.kv["setDocument"](key, value, versionstamp, options, false);
    });
    return this;
  }

  delete(key: DenoKvStrictKey): DenoAtomicOperation {
    this.ops.push(() => this.kv["deleteDocument"](key, false));
    return this;
  }

  min(key: DenoKvStrictKey, n: bigint): DenoAtomicOperation {
    this.ops.push(async (versionstamp) => {
      const { value } = await this.kv["getDocument"](key, false);
      if (!value) {
        await this.kv["setDocument"](
          key,
          { value: n },
          versionstamp,
          undefined,
          false,
        );

        return;
      }

      const val = (value as any).value;
      if (typeof val !== "bigint") {
        throw new Error("Min operation can only be performed on KvU64 value");
      }

      await this.kv["setDocument"](
        key,
        {
          value: n < val ? n : val,
        },
        versionstamp,
        undefined,
        false,
      );
    });

    return this;
  }

  max(key: DenoKvStrictKey, n: bigint): DenoAtomicOperation {
    this.ops.push(async (versionstamp) => {
      const { value } = await this.kv["getDocument"](key, false);
      if (!value) {
        await this.kv["setDocument"](
          key,
          { value: n },
          versionstamp,
          undefined,
          false,
        );

        return;
      }

      const val = (value as any).value;
      if (typeof val !== "bigint") {
        throw new Error("Max operation can only be performed on KvU64 value");
      }

      await this.kv["setDocument"](
        key,
        {
          value: n > val ? n : val,
        },
        versionstamp,
        undefined,
        false,
      );
    });

    return this;
  }

  sum(key: DenoKvStrictKey, n: bigint): DenoAtomicOperation {
    this.ops.push(async (versionstamp) => {
      const { value } = await this.kv["getDocument"](key, false);
      if (!value) {
        await this.kv["setDocument"](
          key,
          { value: n },
          versionstamp,
          undefined,
          false,
        );

        return;
      }

      const val = (value as any).value;
      if (typeof val !== "bigint") {
        throw new Error("Sum operation can only be performed on KvU64 value");
      }

      await this.kv["setDocument"](
        key,
        {
          value: n + val,
        },
        versionstamp,
        undefined,
        false,
      );
    });

    return this;
  }

  check(...checks: DenoAtomicCheck[]): DenoAtomicOperation {
    checks.forEach(({ key, versionstamp }) => {
      this.checks.push(async () => {
        const entry = await this.kv["getDocument"](key, false);
        return entry.versionstamp === versionstamp;
      });
    });

    return this;
  }

  enqueue(value: unknown, options?: DenoKvEnqueueOptions): DenoAtomicOperation {
    this.ops.push(async () => {
      await this.kv.enqueue(value, options);
    });

    return this;
  }

  async commit(): Promise<DenoKvCommitError | DenoKvCommitResult> {
    const taskResult = await this.asyncLock.run(async () => {
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

      return {
        ok: true,
        versionstamp,
      };
    });

    return taskResult.status === "fulfilled" ? taskResult.value : { ok: false };
  }
}
