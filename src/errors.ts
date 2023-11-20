export class InvalidCollectionError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
  }
}
