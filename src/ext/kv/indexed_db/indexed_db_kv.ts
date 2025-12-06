// import { jsonStringify } from "../../../common/json.ts";
// import type {
//   DenoAtomicOperation,
//   DenoKv,
//   DenoKvCommitError,
//   DenoKvCommitResult,
//   DenoKvEnqueueOptions,
//   DenoKvEntryMaybe,
//   DenoKvGetOptions,
//   DenoKvLaxKey,
//   DenoKvListIterator,
//   DenoKvListOptions,
//   DenoKvListSelector,
//   DenoKvSetOptions,
//   DenoKvStrictKey,
//   DenoKvWatchOptions,
// } from "../../../core/types.ts";

// export class IndexedDbKv implements DenoKv {
//   private objStore: IDBObjectStore;

//   constructor(objStore: IDBObjectStore) {
//     this.objStore = objStore;
//   }

//   delete(key: DenoKvStrictKey): Promise<void> | void {
//     this.objStore.delete(jsonStringify(key));
//   }

//   set(
//     key: DenoKvStrictKey,
//     value: unknown,
//     options?: DenoKvSetOptions,
//   ):
//     | Promise<DenoKvCommitError | DenoKvCommitResult>
//     | DenoKvCommitError
//     | DenoKvCommitResult {
//     throw new Error("Method not implemented.");
//   }

//   get(key: DenoKvStrictKey): DenoKvEntryMaybe {
//     const data = this.objStore.get(jsonStringify(key)) ?? {
//       value: null,
//       versionstamp: null,
//     };

//     return {
//       ...data,
//       key: key as DenoKvLaxKey,
//     };
//   }

//   getMany(
//     keys: DenoKvStrictKey[],
//     options?: DenoKvGetOptions,
//   ): Promise<DenoKvEntryMaybe[]> | DenoKvEntryMaybe[] {
//     throw new Error("Method not implemented.");
//   }

//   list(
//     selector: DenoKvListSelector,
//     options?: DenoKvListOptions,
//   ): Promise<DenoKvListIterator> | DenoKvListIterator {
//     throw new Error("Method not implemented.");
//   }

//   listenQueue(handler: (value: unknown) => unknown): Promise<void> {
//     throw new Error("Method not implemented.");
//   }

//   enqueue(
//     value: unknown,
//     options?: DenoKvEnqueueOptions,
//   ): Promise<DenoKvCommitResult> | DenoKvCommitResult {
//     throw new Error("Method not implemented.");
//   }

//   watch(
//     keys: DenoKvStrictKey[],
//     options?: DenoKvWatchOptions,
//   ): ReadableStream<DenoKvEntryMaybe[]> {
//     throw new Error("Method not implemented.");
//   }

//   atomic(): DenoAtomicOperation {
//     throw new Error("Method not implemented.");
//   }

//   close(): void {
//     this.db.close();
//   }

//   private async setDocument(
//     key: DenoKvStrictKey,
//     value: unknown,
//     versionstamp: string,
//     options?: DenoKvSetOptions,
//   ): Promise<DenoKvCommitResult> {
//     const keyStr = jsonStringify(key);
//     const prev = this.objStore.get(keyStr);

//     this.objStore.add({
//       value,
//       versionstamp: versionstamp,
//     }, keyStr);

//     await allFulfilled(
//       this.watchers.map((w) => w.update(keyStr, prev?.value, value)),
//     );

//     if (options?.expireIn !== undefined) {
//       setTimeout(() => this.objStore.delete(keyStr), options.expireIn);
//     }

//     return {
//       ok: true,
//       versionstamp,
//     };
//   }
// }
