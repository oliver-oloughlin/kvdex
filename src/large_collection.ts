import { Collection } from "./collection.ts"
import type {
  CommitResult,
  Document,
  FindManyOptions,
  FindOptions,
  LargeCollectionDefinition,
  LargeKvValue,
} from "./types.ts"
import { extendKey, setLargeDocument } from "./utils.internal.ts"

export class LargeCollection<
  const T1 extends LargeKvValue,
  T2 extends LargeCollectionDefinition<T1>,
> extends Collection<T1, T2> {
  constructor(def: T2) {
    super(def)
  }

  async set(id: Deno.KvKeyPart, data: T1): Promise<CommitResult<T1>> {
    return await setLargeDocument(id, data, this.kv, this)
  }

  async find(
    id: Deno.KvKeyPart,
    options?: FindOptions,
  ): Promise<Document<T1> | null> {
    const idKey = extendKey(this.keys.idKey, id)
    const iter = this.kv.list<string>({ prefix: idKey }, options)

    const versionstamps: string[] = []
    let json = ""

    for await (const { value, versionstamp } of iter) {
      json += value
      versionstamps.push(versionstamp)
    }

    if (!json) {
      return null
    }

    return {
      id,
      value: JSON.parse(json) as T1,
      versionstamp: versionstamps[0]!,
    }
  }

  async findMany(
    ids: Deno.KvKeyPart[],
    options?: FindManyOptions,
  ): Promise<Document<T1>[]> {
    const result = await Promise.all(
      ids.map((id) => this.find(id, options)),
    )

    return result.filter((doc) => !!doc) as Document<T1>[]
  }
}
