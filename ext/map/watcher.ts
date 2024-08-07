import { DenoKvWatchOptions } from "../../mod.ts"
import type { DenoKvEntryMaybe, DenoKvStrictKey } from "../../src/types.ts"
import { jsonStringify } from "../../src/utils.ts"
import type { KvMap } from "./kv_map.ts"

export class Watcher {
  private map: KvMap
  private keys: DenoKvStrictKey[]
  private options?: DenoKvWatchOptions
  private enqueue: (entries: DenoKvEntryMaybe[]) => unknown
  readonly stream: ReadableStream<DenoKvEntryMaybe[]>

  constructor(
    map: KvMap,
    keys: DenoKvStrictKey[],
    options?: DenoKvWatchOptions,
  ) {
    this.map = map
    this.keys = keys
    this.options = options

    let enqueue: (entries: DenoKvEntryMaybe[]) => unknown = () => {}

    this.stream = new ReadableStream({
      start(controller) {
        enqueue = controller.enqueue
      },
    })

    this.enqueue = enqueue
  }

  check(key: DenoKvStrictKey) {
    const match = this.keys.some((k) => jsonStringify(k) === jsonStringify(key))
    if (!match) return

    const entries = this.map.getMany(this.keys)
    this.enqueue(entries)
  }
}
