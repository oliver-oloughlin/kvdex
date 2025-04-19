import type { TaskResult } from "./types.ts";

/**
 * Lock that handles sequentially running asynchrounous tasks using a queue based startegy.
 */
export class AsyncLock {
  private queue: PromiseWithResolvers<boolean>[];

  constructor() {
    this.queue = [];
  }

  /**
   * Run a task asynchronously using the lock.
   * Places the task in the task queue and runs it as soon as any prior tasks have completed.
   *
   * @param fn - Task callback function.
   * @returns A promise resolving to the awaited return of the given callback function.
   */
  async run<const T>(fn: () => T): Promise<TaskResult<Awaited<T>>> {
    try {
      const acquiredLock = await this.acquireLock();
      if (!acquiredLock) {
        return {
          status: "cancelled",
        };
      }

      const value = await fn();
      this.releaseLock();
      return {
        status: "fulfilled",
        value: value,
      };
    } catch (err) {
      this.releaseLock();
      return {
        status: "rejected",
        error: err,
      };
    }
  }

  /** Cancel and remove any queued tasks. */
  cancel(): void {
    let lock = this.queue.shift();
    while (lock) {
      lock.resolve(false);
      lock = this.queue.shift();
    }
  }

  private async acquireLock(): Promise<boolean> {
    const prev = this.queue.at(-1);
    const next = Promise.withResolvers<boolean>();
    this.queue.push(next);
    return await prev?.promise ?? true;
  }

  private releaseLock(): void {
    const lock = this.queue.shift();
    lock?.resolve(true);
  }
}
