/**
 * @module # KV
 *
 * Support for alternative KV backends, such as `Map`, `localStorage`, and `IndexedDB`.
 *
 * Can be used to employ `kvdex` in the browser or other environments where Deno's KV store is not available,
 * or to adapt other database backends.
 *
 * ## Map
 *
 * Support for `Map` as KV backend.
 * - Provides a storage adapter, extending backend support to the `Storage` interface (e.g. `localStorage`).
 * - Provides an `IndexedDB` adapter, enabling the use of `IndexedDB` as a KV backend.
 *
 * @example
 * ```ts
 * import { kvdex } from "@olli/kvdex";
 * import { MapKv } from "@olli/kvdex/kv";
 *
 * // Create an in-memory database using `Map` as the KV backend
 * const kv = new MapKv(); // Equivalent to `new MapKv({ map: new Map() })`
 * const db = kvdex({ kv });
 * ```
 *
 * @example
 * ```ts
 * import { kvdex } from "@olli/kvdex";
 * import { MapKv, StorageAdapter } from "@olli/kvdex/kv";
 *
 * // Create a persistent database using `localStorage` as the KV backend
 * const map = new StorageAdapter(); // Equivalent to `new StorageAdapter(localStorage)`
 * const kv = new MapKv({ map });
 * const db = kvdex({ kv });
 * ```
 *
 * @example
 * ```ts
 * import { kvdex } from "@olli/kvdex";
 * import { MapKv, indexedDbAdapter } from "@olli/kvdex/kv";
 *
 * // Create a persistent database using `IndexedDB` as the KV backend
 * const map = await indexedDbAdapter(); // Opens an IndexedDB database with default name and store.
 * const kv = new MapKv({ map });
 * const db = kvdex({ kv });
 * ```
 */

export * from "./map/mod.ts";
