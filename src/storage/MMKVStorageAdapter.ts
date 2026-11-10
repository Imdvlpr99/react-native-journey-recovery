import { StorageAdapter } from '../types/storage';
import { JourneyRecoveryError } from '../utils/errors';

export interface MMKVLike {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  getAllKeys?(): string[] | readonly string[];
}

/**
 * High-performance storage adapter using react-native-mmkv instance.
 */
export class MMKVStorageAdapter implements StorageAdapter {
  constructor(private mmkv: MMKVLike) {}

  async getItem(key: string): Promise<string | null> {
    try {
      const val = this.mmkv.getString(key);
      return val !== undefined ? val : null;
    } catch (error) {
      throw new JourneyRecoveryError(
        'STORAGE_UNAVAILABLE',
        `MMKV failed to read key "${key}": ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error
      );
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      this.mmkv.set(key, value);
    } catch (error) {
      throw new JourneyRecoveryError(
        'STORAGE_UNAVAILABLE',
        `MMKV failed to write key "${key}": ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error
      );
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      this.mmkv.delete(key);
    } catch (error) {
      throw new JourneyRecoveryError(
        'STORAGE_UNAVAILABLE',
        `MMKV failed to remove key "${key}": ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error
      );
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      if (typeof this.mmkv.getAllKeys === 'function') {
        const keys = this.mmkv.getAllKeys();
        return Array.from(keys);
      }
      return [];
    } catch (error) {
      throw new JourneyRecoveryError(
        'STORAGE_UNAVAILABLE',
        `MMKV failed to list keys: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error
      );
    }
  }
}

