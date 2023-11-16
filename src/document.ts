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

export class Document<const TOutput extends KvValue> {
  readonly id: KvId
  readonly versionstamp: KvVersionstamp<TOutput>
  readonly value: TOutput

  constructor(
    // deno-lint-ignore no-explicit-any
    model: Model<any, TOutput>,
    { id, versionstamp, value }: DocumentData<TOutput>,
  ) {
    this.id = id
    this.versionstamp = versionstamp
    this.value = model.__validate?.(value) ?? model.parse(value)
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
  flat(): FlatDocumentData<TOutput> {
    if (isKvObject(this.value)) {
      return {
        id: this.id,
        versionstamp: this.versionstamp,
        ...this.value as KvObject,
      } as unknown as FlatDocumentData<TOutput>
    }

    return {
      id: this.id,
      versionstamp: this.versionstamp,
      value: this.value,
    } as unknown as FlatDocumentData<TOutput>
  }
}
