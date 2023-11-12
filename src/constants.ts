import type { MergeType } from "./types.ts"

// Key prefixes
export const KVDEX_KEY_PREFIX = "__kvdex__"

export const ID_KEY_PREFIX = "__id__"

export const PRIMARY_INDEX_KEY_PREFIX = "__index_primary__"

export const SECONDARY_INDEX_KEY_PREFIX = "__index_secondary__"

export const SEGMENT_KEY_PREFIX = "__segment__"

export const UNDELIVERED_KEY_PREFIX = "__undelivered__"

// Fixed limits
export const ATOMIC_OPERATION_MUTATION_LIMIT = 1_000

export const GET_MANY_KEY_LIMIT = 10

export const LARGE_COLLECTION_STRING_LIMIT = 30_000

// Defaults
export const DEFAULT_INTERVAL = 60 * 60 * 1_000 // 1 hour

export const DEFAULT_INTERVAL_RETRY = 10

export const DEFAULT_MERGE_TYPE: MergeType = "shallow"
