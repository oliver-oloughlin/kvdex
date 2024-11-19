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
 * deno run -A --unstable-kv jsr:@olli/kvdex/migrate --source=./source.sqlite3 --target=./target.sqlite3
 * ```
 *
 * ## Function
 *
 * Use the migrate function and pass a source KV instance and a target KV instance.
 * Optionally pass `all: true` to migrate all entries.
 *
 * ```ts
 * import { migrate } from "@olli/kvdex/migrate"
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

// Imports
import { parseArgs } from "@std/cli/parse-args";
import { migrate } from "./migrate.ts";
import { NoKvFoundError } from "./errors.ts";

// Exports
export { migrate };
export type * from "./types.ts";
export * from "./errors.ts";

// Run migrate if main
if (import.meta.main) {
  const { source, target, all } = parseArgs(Deno.args, {
    string: ["source", "target"],
    boolean: ["all"],
  });

  if (!source) {
    throw new NoKvFoundError(
      "A source KV path to export from must be provided using the --source argument",
    );
  }

  if (!target) {
    throw new NoKvFoundError(
      "A target KV path to export to must be provided using the --target argument",
    );
  }

  using sourceKv = await Deno.openKv(source);
  using targetKv = await Deno.openKv(target);

  await migrate({
    source: sourceKv,
    target: targetKv,
    all,
  });
}
