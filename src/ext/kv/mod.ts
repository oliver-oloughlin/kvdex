/**
 * @module # KV
 *
 * Support for alternative KV backends, such as `Map` and `localStorage`.
 *
 * Can be used to employ `kvdex` in the browser or other environments where Deno's KV store is not available,
 * or to adapt other database backends.
 *
 * ## Map
 *
 * Support for `Map` as KV backend.
 * Also provides a storage adapter, extending backend support to the `Storage` interface (e.g. `localStorage`).
 *
 * @example
 * ```ts
 * import { kvdex } from "@olli/kvdex";
 * import { MapKv } from "@olli/kvdex/kv/map";
 *
 * // Create an in-memory database from a `MapKv` instance, using `Map` as it's backend.
 * const kv = new MapKv({ map: new Map() }); // Equivalent to `new MapKv()`
 * const db = kvdex({ kv });
 * ```
 *
 * @example
 * ```ts
 * import { kvdex } from "@olli/kvdex";
 * import { MapKv, StorageAdapter } from "@olli/kvdex/kv/map";
 *
 * // Create a persistent database from a `MapKv` instance, using `localStorage` as it's backend.
 * const map = new StorageAdapter(localStorage); // Equivalent to `new StorageAdapter()`
 * const kv = new MapKv({ map });
 * const db = kvdex({ kv });
 * ```
 */

export * from "./map/mod.ts";
