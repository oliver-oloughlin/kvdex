export class AsyncLock {
  private queue: PromiseWithResolvers<void>[];

  constructor() {
    this.queue = [];
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.lock();
    const result = await fn();
    this.release();
    return result;
  }

  async close(): Promise<void> {
    for (const lock of this.queue) {
      lock.resolve();
      await lock.promise;
    }
  }

  private async lock(): Promise<void> {
    const prev = this.queue.at(-1);
    const next = Promise.withResolvers<void>();
    this.queue.push(next);
    await prev?.promise;
  }

  private release(): void {
    const lock = this.queue.shift();
    lock?.resolve();
  }
}
