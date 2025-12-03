import type { TypeKey } from "./type_key.ts";

/**
 * Map from special type entry to value.
 *
 * @param key - Type key.
 * @param value - JSON value to map from.
 * @returns Mapped value.
 */
export function mapValue<T>(key: TypeKey, value: unknown): T {
  return (value as Record<string, T>)[key];
}
