/**
 * Map from special type entry to value.
 *
 * @param key - Type key.
 * @param value - JSON value to map from.
 * @returns Mapped value.
 */
export function mapValue<T>(key: string, value: unknown): T {
  return (value as Record<string, T>)[key];
}
