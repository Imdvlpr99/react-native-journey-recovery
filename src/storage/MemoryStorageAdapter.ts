import { StorageAdapter } from '../types/storage';

/**
 * In-memory storage adapter for testing and ephemeral session management.
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private store: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    const value = this.store.get(key);
    return value !== undefined ? value : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  /**
   * Clears all in-memory keys. Helpful for test setup/teardown.
   */
  async clear(): Promise<void> {
    this.store.clear();
  }
}

