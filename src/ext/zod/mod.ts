/**
 * @module # Zod
 *
 * Extended support for Zod. Includes schemas for some of the KV-types.
 *
 * ## Schemas
 *
 * The zod extension provides schemas for some of the Kv-types, such as KvId,
 * KvValue, KvObject and KvArray. This makes it easier to properly build your
 * schemas.
 *
 * ```ts
 * import { z } from "npm:zod"
 * import { KvIdSchema } from "jsr:@olli/kvdex/zod"
 *
 * const UserSchema = z.object({
 *   username: z.string(),
 *   postIds: z.array(KvIdSchema),
 * })
 *
 * const PostSchema = z.object({
 *   text: z.string(),
 *   userId: KvIdSchema,
 * })
 * ```
 */

export * from "./schemas.ts";
