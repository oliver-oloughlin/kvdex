import type {
  DenoAtomicOperation,
  DenoKv,
  DenoKvCommitResult,
  DenoKvEnqueueOptions,
  DenoKvEntry,
  DenoKvEntryMaybe,
  DenoKvLaxKey,
  DenoKvListIterator,
  DenoKvListOptions,
  DenoKvListSelector,
  DenoKvSetOptions,
  DenoKvStrictKey,
  DenoKvWatchOptions,
} from "../../src/types.ts"
import { jsonParse, jsonStringify } from "../../src/utils.ts"
import { KvMapAtomicOperation } from "./atomic.ts"
import { keySort } from "./key_sort.ts"
import { Watcher } from "./watcher.ts"

export class KvMap implements DenoKv {
  private map = new Map<string, Omit<DenoKvEntry, "key">>()
  private watchers: Watcher[]
  private listenHandlers: ((msg: unknown) => unknown)[]
  private listener:
    | {
      promise: Promise<void>
      resolve: () => void
    }
    | undefined

  constructor(entries?: DenoKvEntry[]) {
    this.map = new Map()
    this.watchers = []
    this.listenHandlers = []

    entries?.forEach(({ key, ...data }) =>
      this.map.set(jsonStringify(key), data)
    )
  }

  close(): void {
    this.map.clear()
    this.watchers = []
    this.listenHandlers = []
    this.listener?.resolve()
    this.listener = undefined
  }

  delete(key: DenoKvStrictKey) {
    this.map.delete(jsonStringify(key))
    this.watchers.forEach((w) => w.update(key))
  }

  get(key: DenoKvStrictKey): DenoKvEntryMaybe {
    const data = this.map.get(jsonStringify(key)) ?? {
      value: null,
      versionstamp: null,
    }

    return {
      ...data,
      key: key as DenoKvLaxKey,
    }
  }

  getMany(keys: DenoKvStrictKey[]): DenoKvEntryMaybe[] {
    return keys.map((key) => this.get(key))
  }

  set(
    key: DenoKvStrictKey,
    value: unknown,
    options?: DenoKvSetOptions,
  ): DenoKvCommitResult {
    const versionstamp = crypto.randomUUID()

    this.map.set(jsonStringify(key), {
      value,
      versionstamp,
    })

    this.watchers.forEach((w) => w.update(key))

    if (options?.expireIn !== undefined) {
      setInterval(() => this.delete(key), options.expireIn)
    }

    return {
      ok: true,
      versionstamp,
    }
  }

  list(
    selector: DenoKvListSelector,
    options?: DenoKvListOptions,
  ): DenoKvListIterator {
    let entries = Array.from(this.map.entries())
    const start = (selector as any).start as DenoKvStrictKey | undefined
    const end = (selector as any).end as DenoKvStrictKey | undefined
    const prefix = (selector as any).prefix as DenoKvStrictKey | undefined

    entries.sort(([k1], [k2]) => {
      const key1 = jsonParse<DenoKvStrictKey>(k1)
      const key2 = jsonParse<DenoKvStrictKey>(k2)
      return keySort(key1, key2)
    })

    if (options?.reverse) {
      entries.reverse()
    }

    if (prefix && prefix.length > 0) {
      entries = entries.filter(([key]) => {
        const parsedKey = jsonParse<DenoKvStrictKey>(key)
        const keyPrefix = parsedKey.slice(0, prefix.length)
        return jsonStringify(keyPrefix) === jsonStringify(prefix)
      })
    }

    if (start) {
      const index = entries.findIndex(
        ([key]) => key === jsonStringify(start),
      )

      if (index) {
        entries = entries.slice(index)
      }
    }

    if (end) {
      const index = entries.findIndex(
        ([key]) => key === jsonStringify(end),
      )

      if (index) {
        entries = entries.slice(0, index)
      }
    }

    if (options?.cursor) {
      const index = entries.findIndex(
        ([key]) => key === options.cursor,
      )

      if (index) {
        entries = entries.slice(index)
      }
    }

    const iter = async function* () {
      let count = 0

      for (const [key, entry] of entries) {
        if (options?.limit !== undefined && count >= options?.limit) {
          return
        }

        yield {
          key: jsonParse(key) as DenoKvLaxKey,
          ...entry,
        }

        count++
      }
    }

    const cursorEntry = options?.limit ? entries.at(options?.limit) : undefined
    const cursor = cursorEntry ? cursorEntry[0] : ""
    return Object.assign(iter(), { cursor })
  }

  listenQueue(handler: (value: unknown) => unknown): Promise<void> {
    this.listenHandlers.push(handler)

    if (!this.listener) {
      this.listener = Promise.withResolvers()
    }

    return this.listener.promise
  }

  enqueue(
    value: unknown,
    options?: DenoKvEnqueueOptions,
  ): Promise<DenoKvCommitResult> | DenoKvCommitResult {
    setTimeout(async () => {
      await Promise.all(this.listenHandlers.map((h) => h(value)))
    }, options?.delay ?? 0)

    return {
      ok: true,
      versionstamp: crypto.randomUUID(),
    }
  }

  watch(
    keys: DenoKvStrictKey[],
    options?: DenoKvWatchOptions,
  ): ReadableStream<DenoKvEntryMaybe[]> {
    const watcher = new Watcher(this, keys, options)
    this.watchers.push(watcher)
    return watcher.stream
  }

  atomic(): DenoAtomicOperation {
    return new KvMapAtomicOperation(this)
  }
}
