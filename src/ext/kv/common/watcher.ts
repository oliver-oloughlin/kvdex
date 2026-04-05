import type { DenoKvWatchOptions } from "../../../core/types.ts";
import type { DenoKvEntryMaybe, DenoKvStrictKey } from "../../../core/types.ts";
import { allFulfilled } from "../../../core/utils.ts";
import { jsonStringify } from "../../encoding/mod.ts";

export class Watcher {
  private options: DenoKvWatchOptions;
  private listener: ReturnType<
    typeof Promise.withResolvers<DenoKvEntryMaybe[]>
  >;
  private getter: (
    key: DenoKvStrictKey,
  ) => Promise<DenoKvEntryMaybe> | DenoKvEntryMaybe;

  readonly stream: ReadableStream<DenoKvEntryMaybe[]>;
  readonly keys: DenoKvStrictKey[];

  constructor(
    keys: DenoKvStrictKey[],
    options: DenoKvWatchOptions = {
      raw: false,
    },
    getter: (
      key: DenoKvStrictKey,
    ) => Promise<DenoKvEntryMaybe> | DenoKvEntryMaybe,
  ) {
    this.keys = keys;
    this.options = options;
    this.getter = getter;
    this.listener = Promise.withResolvers<DenoKvEntryMaybe[]>();
    const listener = this.listener;

    this.stream = new ReadableStream({
      async start(controller) {
        const initialEntries = await allFulfilled(keys.map(getter));
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

  async update(keyStr: string, prevValue: any, newValue: any) {
    if (!this.shouldUpdate(keyStr, prevValue, newValue)) {
      return;
    }

    const entries = await allFulfilled(this.keys.map(this.getter));
    this.listener.resolve(entries);

    const { promise, resolve, reject } = Promise.withResolvers<
      DenoKvEntryMaybe[]
    >();

    this.listener.promise = promise;
    this.listener.resolve = resolve;
    this.listener.reject = reject;
  }

  cancel(): void {
    this.listener.reject();
  }

  private shouldUpdate(keyStr: string, prevValue: any, newValue: any): boolean {
    const match = this.keys.some((k) => jsonStringify(k) === keyStr);
    if (!match) {
      return false;
    }

    const hasChanged = prevValue !== newValue;
    if (!hasChanged && !this.options.raw) {
      return false;
    }

    return true;
  }
}
