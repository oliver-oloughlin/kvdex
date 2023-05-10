import { Collection, type CollectionKey } from "./collection.ts"
import type { KvObject } from "./kvdb.types.ts"
import { generateId, getDocumentKey, useKV } from "./kvdb.utils.ts"

export type IndexRecord<T extends KvObject> = Partial<{
  [key in keyof T]: true
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
          const indexValue = data[index]
          const indexKey = getDocumentKey(this.collectionKey, indexValue)
        })
      }

      return await atomic.commit()
    })
  }

}