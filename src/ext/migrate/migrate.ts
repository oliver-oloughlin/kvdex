import { KVDEX_KEY_PREFIX } from "../../constants.ts";
import type { DenoKvStrictKey } from "../../types.ts";
import type { MigrateOptions } from "./types.ts";

/**
 * Migrate entries from a source KV instance to a target KV instance.
 *
 * @example
 * ```ts
 * import { migrate } from "@olli/kvdex/ext/migrate"
 *
 * const source = await Deno.openKv("./source.sqlite3")
 * const target = await Deno.openKv("./target.sqlite3")
 *
 * await migrate({
 *   source,
 *   target,
 * })
 * ```
 *
 * @param options - Migrate options
 */
export async function migrate({
  source,
  target,
  all,
}: MigrateOptions): Promise<void> {
  const iter = await source.list({ prefix: all ? [] : [KVDEX_KEY_PREFIX] });
  for await (const { key, value } of iter) {
    await target.set(key as DenoKvStrictKey, value);
  }
}
