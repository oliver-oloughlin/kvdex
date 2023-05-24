import type { Document, Model } from "./kvdb.types.ts"

export type FlattenedDocument<T extends Model> = T & {
  id: Document<T>["id"],
  versionstamp: Document<T>["versionstamp"]
}

/**
 * Flattens a document at the top level, placing the id and versionstamp together with the document data.
 * Only applicable to documents of type Model.
 * 
 * @param document - The document to flatten.
 * @returns A flattened document with the document data, id and versionstamp.
 */
export function flatten<T extends Model>(document: Document<T>) {
  const { value, ...rest } = document
  return {
    ...value,
    ...rest
  } as FlattenedDocument<T>
}