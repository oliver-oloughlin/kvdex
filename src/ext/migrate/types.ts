/** Options for migrating entries from a source KV instance to a target KV instance */
export type MigrateOptions = {
  /** Source KV. */
  source: Deno.Kv;

  /** Target KV. */
  target: Deno.Kv;

  /**
   * Flag indicating whether to migrate all entries or only kvdex specific entries.
   *
   * @default false
   */
  all?: boolean;
};
