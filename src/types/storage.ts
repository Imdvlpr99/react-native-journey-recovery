/**
 * Storage adapter interface for journey recovery.
 * Provides a minimal, standard asynchronous key-value persistence contract.
 */
export interface StorageAdapter {
  /**
   * Retrieves a string value by key.
   * Returns null if key does not exist.
   */
  getItem(key: string): Promise<string | null>;

  /**
   * Stores a string value associated with a key.
   */
  setItem(key: string, value: string): Promise<void>;

  /**
   * Removes a key and its stored value.
   */
  removeItem(key: string): Promise<void>;

  /**
   * Optional method to list all keys in storage.
   */
  getAllKeys?(): Promise<string[]>;
}
