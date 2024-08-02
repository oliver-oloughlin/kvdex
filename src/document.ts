import type {
  DocumentData,
  FlatDocumentData,
  KvId,
  KvObject,
  KvValue,
  Model,
} from "./types.ts"
import { isKvObject } from "./utils.ts"

/** Represents a database entry with id, versionstamp and value. */
export class Document<const TOutput extends KvValue, const TId extends KvId> {
  readonly id: TId
  readonly versionstamp: string
  readonly value: TOutput

  constructor(
    model: Model<any, TOutput>,
    { id, versionstamp, value }: DocumentData<TOutput, TId>,
  ) {
    this.id = id
    this.versionstamp = versionstamp
    this.value = model.parse(value)
  }

  /**
   * Flatten top layer of document data. Returns an object containing the id,
   * versionstamp and value entries for documents of type Model, else simply returns
   * the document data.
   *
   * @example
   * ```ts
   * // We assume the document exists in the KV store
   * const doc = await db.users.find(123n)
   * const flattened = doc.flat()
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
   * @returns Object containing the id, versionstamp and value entries
   * for documents of type Model, else simply returns the document data.
   */
  flat(): FlatDocumentData<TOutput, TId> {
    if (isKvObject(this.value)) {
      return {
        id: this.id,
        versionstamp: this.versionstamp,
        ...this.value as KvObject,
      } as unknown as FlatDocumentData<TOutput, TId>
    }

    return {
      id: this.id,
      versionstamp: this.versionstamp,
      value: this.value,
    } as unknown as FlatDocumentData<TOutput, TId>
  }
}
