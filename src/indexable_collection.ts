import { Collection, type CommitResult, type CollectionKey } from "./collection.ts"
import type { KvObject, DocumentId } from "./kvdb.types.ts"
import { generateId, getDocumentKey, useKV } from "./kvdb.utils.ts"

export type IndexRecord<T extends KvObject> = Partial<{
  [key in keyof T]: T[key] extends DocumentId ? true : never
}>

export class IndexableCollection<const T extends KvObject> extends Collection<T> {

  private indexRecord?: IndexRecord<T>

  constructor(collectionKey: CollectionKey, indexRecord?: IndexRecord<T>) {
    super(collectionKey)
    this.indexRecord = indexRecord
  }

  async add(data: T) {
    return await useKV(async kv => {
      const id = generateId()
      const idKey = getDocumentKey(this.collectionKey, id)

      let atomic = kv.atomic().set(idKey, data)

      if (this.indexRecord) {
        Object.keys(this.indexRecord).forEach(index => {
          const indexValue = data[index] as DocumentId
          const indexKey = getDocumentKey(this.collectionKey, indexValue)
          atomic = atomic.set(indexKey, data)
        })
      }

      const cr = await atomic.commit()

      const commitResult: CommitResult<T, typeof id> = cr.ok ? {
        ok: true,
        versionstamp: cr.versionstamp,
        id
      } : {
        ok: false
      }

      return commitResult
    })
  }

}