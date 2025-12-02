import type { DenoKv } from "../../core/types.ts";

/** Options for migrating entries from a source KV instance to a target KV instance */
export type MigrateOptions = {
  /** Source KV. */
  source: DenoKv;

  /** Target KV. */
  target: DenoKv;

  /**
   * Flag indicating whether to migrate all entries or only kvdex specific entries.
   *
   * @default false
   */
  all?: boolean;
};
