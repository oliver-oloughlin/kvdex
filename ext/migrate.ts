/**
 * @module # Migrate
 *
 * A utility script and function for migrating entries from a source KV instance to
 * a target KV instance. Only migrates `kvdex` entries by default, but optionally
 * allows for migrating all entries.
 *
 * ## Script
 *
 * Run the migrate script and provide --source and --target arguments. Optionally
 * pass --all to migrate all entries.
 *
 * ```console
 * deno run -A --unstable-kv jsr:@olli/kvdex/ext/migrate --source=./source.sqlite3 --target=./target.sqlite3
 * ```
 *
 * ## Function
 *
 * Use the migrate function and pass a source KV instance and a target KV instance.
 * Optionally pass `all: true` to migrate all entries.
 *
 * ```ts
 * import { migrate } from "jsr:@olli/kvdex/ext/migrate"
 *
 * const source = await Deno.openKv("./source.sqlite3")
 * const target = await Deno.openKv("./target.sqlite3")
 *
 * await migrate({
 *   source,
 *   target
 * })
 * ```
 */

import { parseArgs } from "jsr:@std/cli@^0.217/parse_args"
import { KVDEX_KEY_PREFIX } from "../src/constants.ts"

if (import.meta.main) {
  const { source, target, all } = parseArgs(Deno.args, {
    string: ["source", "target"],
    boolean: ["all"],
  })

  if (!source) {
    console.log(
      "A source KV path to export from must be provided using the --source argument",
    )
    Deno.exit()
  }

  if (!target) {
    console.log(
      "A target KV path to export to must be provided using the --target argument",
    )
    Deno.exit()
  }

  using sourceKv = await Deno.openKv(source)
  using targetKv = await Deno.openKv(target)

  await migrate({
    source: sourceKv,
    target: targetKv,
    all,
  })
}

/** Options for migrating entries from a source KV instance to a target KV instance */
export type MigrateOptions = {
  /** Source KV. */
  source: Deno.Kv

  /** Target KV. */
  target: Deno.Kv

  /**
   * Flag indicating whether to migrate all entries or only kvdex specific entries.
   *
   * @default false
   */
  all?: boolean
}

/**
 * Migrate entries from a source KV instance to a target KV instance.
 *
 * @example
 * ```ts
 * import { migrate } from "jsr:@olli/kvdex/ext/migrate"
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
  const iter = source.list({ prefix: all ? [] : [KVDEX_KEY_PREFIX] })
  for await (const { key, value } of iter) {
    await target.set(key, value)
  }
}
