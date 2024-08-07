import type { DenoKvWatchOptions } from "../../mod.ts"
import type { DenoKvEntryMaybe, DenoKvStrictKey } from "../../src/types.ts"
import { jsonStringify } from "../../src/utils.ts"
import type { KvMap } from "./kv_map.ts"

export class Watcher {
  private listener: ReturnType<typeof Promise.withResolvers<DenoKvStrictKey>>
  readonly stream: ReadableStream<DenoKvEntryMaybe[]>

  constructor(
    kvMap: KvMap,
    keys: DenoKvStrictKey[],
    options?: DenoKvWatchOptions,
  ) {
    this.listener = Promise.withResolvers<DenoKvStrictKey>()
    const listener = this.listener

    this.stream = new ReadableStream({
      async start(controller) {
        let previousEntries = kvMap.getMany(keys)
        controller.enqueue(previousEntries)

        while (true) {
          try {
            const key = await listener.promise
            const match = keys.some((k) =>
              jsonStringify(k) === jsonStringify(key)
            )
            if (!match) {
              const { promise, resolve, reject } = Promise.withResolvers<
                DenoKvStrictKey
              >()

              listener.promise = promise
              listener.resolve = resolve
              listener.reject = reject

              continue
            }

            const entries = kvMap.getMany(keys)

            const previousEntry = previousEntries.find((entry) =>
              jsonStringify(entry.key) === jsonStringify(key)
            )

            const newEntry = entries.find((entry) =>
              jsonStringify(entry.key) === jsonStringify(key)
            )

            if (!previousEntry || !newEntry) {
              const { promise, resolve, reject } = Promise.withResolvers<
                DenoKvStrictKey
              >()

              listener.promise = promise
              listener.resolve = resolve
              listener.reject = reject

              continue
            }

            if (
              !options?.raw &&
              previousEntry.versionstamp === newEntry.versionstamp
            ) {
              const { promise, resolve, reject } = Promise.withResolvers<
                DenoKvStrictKey
              >()

              listener.promise = promise
              listener.resolve = resolve
              listener.reject = reject

              continue
            }

            previousEntries = entries
            controller.enqueue(entries)

            const { promise, resolve, reject } = Promise.withResolvers<
              DenoKvStrictKey
            >()

            listener.promise = promise
            listener.resolve = resolve
            listener.reject = reject
          } catch (_) {
            break
          }
        }
      },

      cancel() {
        listener.reject()
      },
    })
  }

  update(key: DenoKvStrictKey) {
    this.listener.resolve(key)
  }
}
