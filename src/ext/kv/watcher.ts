import type { DenoKvWatchOptions } from "../../../mod.ts";
import type { DenoKvEntryMaybe, DenoKvStrictKey } from "../../types.ts";
import { jsonStringify } from "../encoding/json.ts";
import type { MapKv } from "./map_kv.ts";

export class Watcher {
  private kv: MapKv;
  private keys: DenoKvStrictKey[];
  private options?: DenoKvWatchOptions;
  private listener: ReturnType<
    typeof Promise.withResolvers<DenoKvEntryMaybe[]>
  >;
  private previousEntries: DenoKvEntryMaybe[];
  readonly stream: ReadableStream<DenoKvEntryMaybe[]>;

  constructor(
    kv: MapKv,
    keys: DenoKvStrictKey[],
    options?: DenoKvWatchOptions,
  ) {
    this.kv = kv;
    this.keys = keys;
    this.options = options;

    const previousEntries = kv.getMany(keys);
    this.previousEntries = previousEntries;

    this.listener = Promise.withResolvers<DenoKvEntryMaybe[]>();
    const listener = this.listener;

    this.stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(previousEntries);
        while (true) {
          try {
            const entries = await listener.promise;
            controller.enqueue(entries);
          } catch (_) {
            controller.close();
            break;
          }
        }
      },

      cancel() {
        listener.reject();
      },
    });
  }

  update(key: DenoKvStrictKey) {
    const match = this.keys.some((k) =>
      jsonStringify(k) === jsonStringify(key)
    );
    if (!match) return;

    const entries = this.kv.getMany(this.keys);

    const previousEntry = this.previousEntries.find((entry) =>
      jsonStringify(entry.key) === jsonStringify(key)
    );

    const newEntry = entries.find((entry) =>
      jsonStringify(entry.key) === jsonStringify(key)
    );

    if (!previousEntry || !newEntry) return;

    // if (
    //   !options?.raw &&
    //   previousEntry.versionstamp === newEntry.versionstamp
    // ) return

    this.previousEntries = entries;
    this.listener.resolve(entries);

    const { promise, resolve, reject } = Promise.withResolvers<
      DenoKvEntryMaybe[]
    >();

    this.listener.promise = promise;
    this.listener.resolve = resolve;
    this.listener.reject = reject;
  }

  cancel() {
    this.listener.reject();
  }
}
