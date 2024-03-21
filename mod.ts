// Expose constructor functions and classes
export { model } from "./src/model.ts"
export { Kvdex, kvdex } from "./src/kvdex.ts"
export { Collection, collection } from "./src/collection.ts"
export { AtomicBuilder } from "./src/atomic_builder.ts"
export { Document } from "./src/document.ts"

// Expose reusable utilities
export {
  jsonDeserialize,
  jsonParse,
  jsonSerialize,
  jsonStringify,
} from "./src/utils.ts"

// Expose errors
export * from "./src/errors.ts"

// Expose types
export type * from "./src/types.ts"
