import { parseArgs } from "parse_args"
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
