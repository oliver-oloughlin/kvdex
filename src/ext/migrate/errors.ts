export class NoKvFoundError extends Error {
  override name = "NoKvFoundError";

  constructor(
    message?: string | undefined,
    options?: ErrorOptions | undefined,
  ) {
    super(message, options);
  }
}
