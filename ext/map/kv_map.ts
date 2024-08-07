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
  KvValue,
} from "../../src/types.ts"
import { jsonStringify } from "../../src/utils.ts"
import { KvMapAtomicOperation } from "./atomic.ts"
import { Watcher } from "./watcher.ts"

export class KvMap implements DenoKv {
  private map = new Map<DenoKvLaxKey, Omit<DenoKvEntry, "key">>()
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
    this.map = new Map()
    this.watchers = []
    this.listenHandlers = []

    entries?.forEach(({ key, ...data }) =>
      this.map.set(key as DenoKvLaxKey, data)
    )
  }

  close(): void {
    this.map.clear()
    this.watchers = []
    this.listenHandlers = []
    this.listener = undefined
  }

  delete(key: DenoKvStrictKey) {
    this.map.delete(key)
    this.watchers.forEach((w) => w.check(key))
  }

  get(key: DenoKvStrictKey): DenoKvEntryMaybe {
    const data = this.map.get(key) ?? {
      value: null,
      versionstamp: null,
    }

    return {
      ...data,
      key: key as DenoKvLaxKey,
    }
  }

  getMany(keys: DenoKvStrictKey[]): DenoKvEntryMaybe[] {
    return keys.map(this.get)
  }

  set(
    key: DenoKvStrictKey,
    value: KvValue,
    options?: DenoKvSetOptions,
  ): DenoKvCommitResult {
    const versionstamp = crypto.randomUUID()

    this.map.set(key, {
      value,
      versionstamp,
    })

    if (options?.expireIn !== undefined) {
      setInterval(() => this.delete(key), options.expireIn)
    }

    this.watchers.forEach((w) => w.check(key))

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
    const prefix = (selector as any).end as DenoKvStrictKey | undefined

    if (options?.reverse) {
      entries.reverse()
    }

    if (prefix && prefix.length > 0) {
      entries = entries.filter(([key]) => {
        const keyPrefix = key.slice(0, prefix.length)
        return jsonStringify(keyPrefix) === jsonStringify(prefix)
      })
    }

    if (start) {
      const index = entries.findIndex(
        ([key]) => jsonStringify(key) === jsonStringify(start),
      )

      if (index) {
        entries = entries.slice(index)
      }
    }

    if (end) {
      const index = entries.findIndex(
        ([key]) => jsonStringify(key) === jsonStringify(end),
      )

      if (index) {
        entries = entries.slice(0, index)
      }
    }

    if (options?.cursor) {
      const index = entries.findIndex(
        ([key]) => jsonStringify(key) === options.cursor,
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
          key,
          ...entry,
        }

        count++
      }
    }

    const cursorEntry = options?.limit ? entries.at(options?.limit) : undefined
    const cursor = cursorEntry ? jsonStringify(cursorEntry[0]) : ""
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
