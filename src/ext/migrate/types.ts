import type { DenoKv, KvKey } from "../../core/types.ts";

/** Options for migrating entries from a source KV instance to a target KV instance */
export type MigrateOptions = {
  /** Source KV. */
  source: DenoKv;

  /** Target KV. */
  target: DenoKv;

  /** Prefix to migrate without rewriting keys. Defaults to `["__kvdex__"]`. Ignored when `all` is true. */
  basePath?: KvKey;

  /**
   * Flag indicating whether to migrate all entries or only kvdex specific entries.
   *
   * @default false
   */
  all?: boolean;
};
