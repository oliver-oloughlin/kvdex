/**
 * @module # Map
 *
 * Support for `Map` as KV backend.
 * - Provides a storage adapter, extending backend support to the `Storage` interface (e.g. `localStorage`).
 * - Provides an `IndexedDB` adapter, enabling the use of `IndexedDB` as a KV backend.
 *
 * @example
 * ```ts
 * import { kvdex } from "@olli/kvdex";
 * import { mapKv } from "@olli/kvdex/kv/map";
 *
 * // Create an in-memory database using `Map` as the KV backend
 * const kv = mapKv(); // Equivalent to `mapKv({ map: new Map() })`
 * const db = kvdex({ kv });
 * ```
 *
 * @example
 * ```ts
 * import { kvdex } from "@olli/kvdex";
 * import { mapKv, storageAdapter } from "@olli/kvdex/kv/map";
 *
 * // Create a persistent database using `localStorage` as the KV backend
 * const map = storageAdapter(localStorage);
 * const kv = mapKv({ map });
 * const db = kvdex({ kv });
 * ```
 *
 * @example
 * ```ts
 * import { kvdex } from "@olli/kvdex";
 * import { mapKv, storageAdapter } from "@olli/kvdex/kv/map";
 *
 * // Create a session-scoped database using `sessionStorage` as the KV backend
 * const map = storageAdapter(sessionStorage);
 * const kv = mapKv({ map });
 * const db = kvdex({ kv });
 * ```
 *
 * @example
 * ```ts
 * import { kvdex } from "@olli/kvdex";
 * import { mapKv, indexedDbAdapter } from "@olli/kvdex/kv/map";
 *
 * // Create a persistent database using `IndexedDB` as the KV backend
 * const map = await indexedDbAdapter(); // Opens an IndexedDB database with default name and store.
 * const kv = mapKv({ map });
 * const db = kvdex({ kv });
 * ```
 */

export { MapKv, mapKv } from "./map_kv.ts";
export { StorageAdapter, storageAdapter } from "./storage_adapter.ts";
export { MapKvAtomicOperation } from "./atomic.ts";
export { IndexedDbAdapter, indexedDbAdapter } from "./indexed_db_adapter.ts";
export type * from "./types.ts";
