/** Error representing the use, selection or creation of an invalid collection in a given context. */
export class InvalidCollectionError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
  }
}
