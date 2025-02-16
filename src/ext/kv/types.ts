import type { DenoKvEntry } from "../../types.ts";

/** Interface for basic map methods */
export type BasicMap<K, V> = {
  /**
   * Set a new key/value entry.
   *
   * @param key - Key that identifies the entry.
   * @param value - Value of the entry.
   * @returns void
   */
  set(key: K, value: V): Promise<void | Map<any, any>> | void | Map<any, any>;

  /**
   * Get a key/value entry from the map.
   *
   * @param key - Key that identifies the entry.
   * @returns The entry value or undefined if it does not exist in the map.
   */
  get(key: K): Promise<V | undefined> | V | undefined;

  /**
   * Delete a key/value entry from the map.
   *
   * @param key - Key that identifies the entry.
   * @returns void
   */
  delete(key: K): Promise<void | boolean> | void | boolean;

  /**
   * Get an iterator of the key/value entries in the map.
   *
   * @returns An IterableIterator of [key, value] entries.
   */
  entries(): AsyncIterableIterator<[K, V]> | IterableIterator<[K, V]>;

  /** Removes all key/value entries from the map. */
  clear(): Promise<void> | void;
};

/** Options when constructing a new MapKv instance. */
export type MapKvOptions = {
  /**
   * Underlying map used for data storage.
   *
   * @default new Map()
   */
  map?: BasicMap<any, any>;

  /** Initial KV entries. */
  entries?: DenoKvEntry[];

  /**
   * Whether the underlying map should be cleared or not when the store is closed.
   *
   * @default false
   */
  clearOnClose?: boolean;
};

/**
 * Result object of a queued task.
 *
 * `status` - indicates the state of the task result.
 * Is "fulfilled" if completed successfully, "rejected" if an error was thrown during the task running, or "cancelled" if task was cancelled before running.
 *
 * `value` - Awaited return value of successful task.
 *
 * `error` - Captured error of rejected task.
 */
export type TaskResult<T> = {
  status: "fulfilled";
  value: T;
} | {
  status: "rejected";
  error: unknown;
} | {
  status: "cancelled";
};
