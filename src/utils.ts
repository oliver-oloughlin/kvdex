import type { Document, FlattenedDocument, Model } from "./types.ts"

/**
 * Flattens a document at the top level, placing the id and versionstamp together with the document data.
 * Only applicable to documents of type Model.
 *
 * **Example:**
 * ```ts
 * const userDoc = await db.users.find("oliver")
 *
 * const user = flatten(userDoc)
 * ```
 *
 * @param document - The document to flatten.
 * @returns A flattened document with the document data, id and versionstamp.
 */
export function flatten<T extends Model>(document: Document<T>) {
  const { value, ...rest } = document
  return {
    ...value,
    ...rest,
  } as FlattenedDocument<T>
}
