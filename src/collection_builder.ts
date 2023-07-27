import { Collection } from "./collection.ts"
import { IndexableCollection } from "./indexable_collection.ts"
import type {
  CollectionPrepDefinition,
  IndexableCollectionPrepDefinition,
  KvKey,
  KvValue,
  Model,
} from "./types.ts"

export class CollectionBuilderContext {
  private kv: Deno.Kv
  private key: KvKey

  constructor(kv: Deno.Kv, key: KvKey) {
    this.kv = kv
    this.key = key
  }

  collection<const T extends KvValue>() {
    return new CollectionBuilder<T>(this.kv, this.key)
  }

  indexableCollection<const T extends Model>() {
    return new IndexableCollectionBuilder<T>(this.kv, this.key)
  }
}

class CollectionBuilder<const T extends KvValue> {
  private kv: Deno.Kv
  private key: KvKey

  constructor(kv: Deno.Kv, key: KvKey) {
    this.kv = kv
    this.key = key
  }

  build<const PrepDef extends CollectionPrepDefinition<T>>(def?: PrepDef) {
    return new Collection<T, PrepDef & { kv: Deno.Kv; key: KvKey }>({
      ...def as PrepDef ?? {},
      kv: this.kv,
      key: this.key,
    })
  }
}

class IndexableCollectionBuilder<const T extends Model> {
  private kv: Deno.Kv
  private key: KvKey

  constructor(kv: Deno.Kv, key: KvKey) {
    this.kv = kv
    this.key = key
  }

  build<const PrepDef extends IndexableCollectionPrepDefinition<T>>(
    def: PrepDef,
  ) {
    return new IndexableCollection<T, PrepDef & { kv: Deno.Kv; key: KvKey }>({
      ...def,
      kv: this.kv,
      key: this.key,
    })
  }
}
