import type { DenoKvWatchOptions } from "../../../mod.ts";
import type { DenoKvEntryMaybe, DenoKvStrictKey } from "../../types.ts";
import { jsonStringify } from "../encoding/mod.ts";
import type { MapKv } from "./map_kv.ts";

export class Watcher {
  private kv: MapKv;
  private keys: DenoKvStrictKey[];
  private options: DenoKvWatchOptions;
  private listener: ReturnType<
    typeof Promise.withResolvers<DenoKvEntryMaybe[]>
  >;
  readonly stream: ReadableStream<DenoKvEntryMaybe[]>;

  constructor(
    kv: MapKv,
    keys: DenoKvStrictKey[],
    options: DenoKvWatchOptions = {
      raw: false,
    },
  ) {
    this.kv = kv;
    this.keys = keys;
    this.options = options;
    this.listener = Promise.withResolvers<DenoKvEntryMaybe[]>();
    const listener = this.listener;

    this.stream = new ReadableStream({
      async start(controller) {
        const initialEntries = await kv.getMany(keys);
        controller.enqueue(initialEntries);
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

  async update(key: string, prevValue: any, newValue: any) {
    const match = this.keys.some((k) => jsonStringify(k) === key);
    if (!match) return;

    const entries = await this.kv.getMany(this.keys);
    const hasChanged = prevValue !== newValue;

    if (!hasChanged && !this.options.raw) return;

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
