/**
 * @module # KV
 *
 * Support for alternative KV backends, such as `Map` and `localStorage`.
 *
 * Can be used to employ `kvdex` in the browser or other environments where Deno's KV store is not available,
 * or to adapt to other database backends.
 *
 * @example
 * ```ts
 * import { kvdex } from "@olli/kvdex"
 * import { MapKv } from "@olli/kvdex/kv"
 *
 * // Create a database from a `MapKv` instance, using `Map` as it's backend by default.
 * const kv = new MapKv()
 * const db = kvdex({ kv })
 * ```
 *
 * @example
 * ```ts
 * import { kvdex } from "@olli/kvdex"
 * import { MapKv } from "@olli/kvdex/kv"
 *
 * // Create a database from a `MapKv` instance, explicitly using `Map` as it's backend.
 * const kv = new MapKv({ map: new Map() })
 * const db = kvdex({ kv })
 * ```
 *
 * @example
 * ```ts
 * import { kvdex } from "@olli/kvdex"
 * import { MapKv, StorageAdapter } from "@olli/kvdex/kv"
 *
 * // Create a database from a `MapKv` instance, using `localStorage` as it's backend by default.
 * const map = new StorageAdapter()
 * const kv = new MapKv({ map })
 * const db = kvdex({ kv })
 * ```
 *
 * @example
 * ```ts
 * import { kvdex } from "@olli/kvdex"
 * import { MapKv, StorageAdapter } from "@olli/kvdex/kv"
 *
 * // Create an ephimeral database from a `MapKv` instance, explicitly using `localStorage` as it's backend.
 * const map = new StorageAdapter(localStorage)
 * const kv = new MapKv({ map, clearOnClose: true })
 * const db = kvdex({ kv })
 * ```
 */

export { MapKv } from "./map_kv.ts";
export { StorageAdapter } from "./storage_adapter.ts";
export { MapKvAtomicOperation } from "./atomic.ts";
export type * from "./types.ts";
