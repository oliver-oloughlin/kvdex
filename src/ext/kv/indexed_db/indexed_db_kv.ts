import { jsonStringify } from "../../../common/json.ts";
import type {
  DenoAtomicOperation,
  DenoKv,
  DenoKvCommitError,
  DenoKvCommitResult,
  DenoKvEnqueueOptions,
  DenoKvEntryMaybe,
  DenoKvGetOptions,
  DenoKvLaxKey,
  DenoKvListIterator,
  DenoKvListOptions,
  DenoKvListSelector,
  DenoKvSetOptions,
  DenoKvStrictKey,
  DenoKvWatchOptions,
} from "../../../core/types.ts";
import { setEntry } from "../common/entry_handlers.ts";
import { createVersionstamp } from "../common/utils.ts";
import { Watcher } from "../common/watcher.ts";

export class IndexedDbKv implements DenoKv {
  private objStore: IDBObjectStore;
  private watchers: Watcher[];

  constructor(objStore: IDBObjectStore) {
    this.objStore = objStore;
    this.watchers = [];
  }

  delete(key: DenoKvStrictKey): Promise<void> | void {
    this.objStore.delete(jsonStringify(key));
  }

  set(
    key: DenoKvStrictKey,
    value: unknown,
    options?: DenoKvSetOptions,
  ): Promise<DenoKvCommitResult | DenoKvCommitError> {
    return this.setDocument(key, value, createVersionstamp(), options);
  }

  get(key: DenoKvStrictKey): DenoKvEntryMaybe {
    const data = this.objStore.get(jsonStringify(key)) ?? {
      value: null,
      versionstamp: null,
    };

    return {
      ...data,
      key: key as DenoKvLaxKey,
    };
  }

  getMany(
    keys: DenoKvStrictKey[],
    options?: DenoKvGetOptions,
  ): Promise<DenoKvEntryMaybe[]> | DenoKvEntryMaybe[] {
    throw new Error("Method not implemented.");
  }

  list(
    selector: DenoKvListSelector,
    options?: DenoKvListOptions,
  ): Promise<DenoKvListIterator> | DenoKvListIterator {
    throw new Error("Method not implemented.");
  }

  listenQueue(handler: (value: unknown) => unknown): Promise<void> {
    throw new Error("Method not implemented.");
  }

  enqueue(
    value: unknown,
    options?: DenoKvEnqueueOptions,
  ): Promise<DenoKvCommitResult> | DenoKvCommitResult {
    throw new Error("Method not implemented.");
  }

  watch(
    keys: DenoKvStrictKey[],
    options?: DenoKvWatchOptions,
  ): ReadableStream<DenoKvEntryMaybe[]> {
    throw new Error("Method not implemented.");
  }

  atomic(): DenoAtomicOperation {
    throw new Error("Method not implemented.");
  }

  close(): void {
    this.db.close();
  }

  private async setDocument(
    key: DenoKvStrictKey,
    value: unknown,
    versionstamp: string,
    options: DenoKvSetOptions | undefined,
  ): Promise<DenoKvCommitResult> {
    return await setEntry({
      key,
      value,
      versionstamp,
      options,
      watchers: this.watchers,
      get: (keyStr) => this.objStore.get(keyStr).result,
      set: (keyStr, entry) => this.objStore.put(entry, keyStr),
    });
  }
}
