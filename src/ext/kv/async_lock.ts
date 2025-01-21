export class AsyncLock {
  private queue: PromiseWithResolvers<void>[];

  constructor() {
    this.queue = [];
  }

  async lock() {
    const prev = this.queue.at(-1);
    const next = Promise.withResolvers<void>();
    this.queue.push(next);
    await prev?.promise;
  }

  release() {
    const lock = this.queue.shift();
    lock?.resolve();
  }

  async cancel() {
    for (const lock of this.queue) {
      lock.resolve();
      await lock.promise;
    }
  }
}
