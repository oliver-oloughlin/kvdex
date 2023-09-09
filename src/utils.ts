import type { Document, FlattenedDocument, Model } from "./types.ts"

/**
 * Flattens a document at the top level, placing the id and versionstamp together with the document data.
 * Only applicable to documents of type Model.
 *
 * **Example:**
 * ```ts
 * // We assume the document exists in the KV store
 * const doc = await db.users.find(123n)
 * const flattened = flatten(doc)
 *
 * // Document:
 * // {
 * //   id,
 * //   versionstamp,
 * //   value
 * // }
 *
 * // Flattened:
 * // {
 * //   id,
 * //   versionstamp,
 * //   ...value
 * // }
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
