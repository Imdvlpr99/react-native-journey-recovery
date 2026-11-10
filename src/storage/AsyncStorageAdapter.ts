import { StorageAdapter } from '../types/storage';
import { JourneyRecoveryError } from '../utils/errors';

export interface AsyncStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys?(): Promise<readonly string[] | string[]>;
}

/**
 * Storage adapter delegating to React Native AsyncStorage or compatible client.
 */
export class AsyncStorageAdapter implements StorageAdapter {
  constructor(private client: AsyncStorageLike) {}

  async getItem(key: string): Promise<string | null> {
    try {
      const val = await this.client.getItem(key);
      return val ?? null;
    } catch (error) {
      throw new JourneyRecoveryError(
        'STORAGE_UNAVAILABLE',
        `Failed to read key "${key}" from storage`,
        undefined,
        error
      );
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.client.setItem(key, value);
    } catch (error) {
      throw new JourneyRecoveryError(
        'STORAGE_UNAVAILABLE',
        `Failed to write key "${key}" to storage`,
        undefined,
        error
      );
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.client.removeItem(key);
    } catch (error) {
      throw new JourneyRecoveryError(
        'STORAGE_UNAVAILABLE',
        `Failed to remove key "${key}" from storage`,
        undefined,
        error
      );
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      if (typeof this.client.getAllKeys === 'function') {
        const keys = await this.client.getAllKeys();
        return Array.from(keys);
      }
      return [];
    } catch (error) {
      throw new JourneyRecoveryError(
        'STORAGE_UNAVAILABLE',
        'Failed to retrieve keys from storage',
        undefined,
        error
      );
    }
  }
}

