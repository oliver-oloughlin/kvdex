export class InvalidAtomicBuilderCollectionError extends Error {
  constructor(options?: ErrorOptions) {
    super("Atomic operations are not supported for large collections", options)
  }
}
