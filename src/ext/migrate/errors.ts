export class NoKvFoundError extends Error {
  name = "NoKvFoundError"

  constructor(
    message?: string | undefined,
    options?: ErrorOptions | undefined,
  ) {
    super(message, options)
  }
}
