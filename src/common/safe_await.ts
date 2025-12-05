export async function safeAwait<T>(maybePromise: T): Promise<T> {
  if (maybePromise instanceof Promise) {
    return await maybePromise;
  }

  return maybePromise;
}
