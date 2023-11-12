import type {
  DocumentData,
  FlatDocumentData,
  KvId,
  KvObject,
  KvValue,
  KvVersionstamp,
  Model,
} from "./types.ts"
import { isKvObject } from "./utils.ts"

export class Document<
  const T1 extends KvValue,
  const T2 extends T1,
> {
  readonly id: KvId
  readonly versionstamp: KvVersionstamp<T1>
  readonly value: T1

  constructor(
    model: Model<T1, T2>,
    { id, versionstamp, value }: DocumentData<T1>,
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
  flat(): FlatDocumentData<T1> {
    if (isKvObject(this.value)) {
      return {
        id: this.id,
        versionstamp: this.versionstamp,
        ...this.value as KvObject,
      } as unknown as FlatDocumentData<T1>
    }

    return {
      id: this.id,
      versionstamp: this.versionstamp,
      value: this.value,
    } as unknown as FlatDocumentData<T1>
  }
}
