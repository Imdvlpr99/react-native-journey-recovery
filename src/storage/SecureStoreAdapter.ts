import { StorageAdapter } from '../types/storage';
import { JourneyRecoveryError } from '../utils/errors';

export interface SecureStoreOptions {
  keychainService?: string;
  keychainAccessible?: number;
  requireAuthentication?: boolean;
  [key: string]: unknown;
}

export interface SecureStoreLike {
  getItemAsync(key: string, options?: SecureStoreOptions): Promise<string | null>;
  setItemAsync(key: string, value: string, options?: SecureStoreOptions): Promise<void>;
  deleteItemAsync(key: string, options?: SecureStoreOptions): Promise<void>;
}

export interface SecureStoreAdapterOptions {
  /**
   * Expo SecureStore has a 2048-byte limit on Android.
   * Chunks larger snapshots to prevent OS keystore exceptions.
   * Default: 1800 bytes. Set to 0 to disable chunking.
   */
  chunkSize?: number;
  /**
   * Default SecureStore options passed to getItemAsync, setItemAsync, deleteItemAsync.
   */
  storeOptions?: SecureStoreOptions;
}

interface ChunkManifest {
  __isSecureChunked: true;
  totalChunks: number;
}

/**
 * High-security storage adapter for Expo SecureStore (`expo-secure-store`)
 * and hardware-backed keychain/keystore storage.
 *
 * Includes automatic chunking to overcome Android's 2048-byte Keystore limit.
 */
export class SecureStoreAdapter implements StorageAdapter {
  private chunkSize: number;
  private storeOptions?: SecureStoreOptions;

  constructor(
    private client: SecureStoreLike,
    options?: SecureStoreAdapterOptions
  ) {
    this.chunkSize = options?.chunkSize ?? 1800;
    this.storeOptions = options?.storeOptions;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const raw = await this.client.getItemAsync(key, this.storeOptions);
      if (!raw) return null;

      // Check if this key points to a chunked manifest
      if (raw.startsWith('{"__isSecureChunked":true')) {
        try {
          const manifest: ChunkManifest = JSON.parse(raw);
          const chunkPromises: Promise<string | null>[] = [];
          for (let i = 0; i < manifest.totalChunks; i++) {
            chunkPromises.push(this.client.getItemAsync(`${key}__c${i}`, this.storeOptions));
          }

          const chunks = await Promise.all(chunkPromises);
          if (chunks.some((c) => c === null)) {
            throw new Error(`Incomplete chunk sequence for secure key "${key}"`);
          }

          return chunks.join('');
        } catch {
          // If manifest parsing fails, fallback to raw value
          return raw;
        }
      }

      return raw;
    } catch (error) {
      throw new JourneyRecoveryError(
        'STORAGE_UNAVAILABLE',
        `Failed to read secure key "${key}" from secure storage`,
        undefined,
        error
      );
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      // If chunking is enabled and value exceeds chunk size
      if (this.chunkSize > 0 && value.length > this.chunkSize) {
        const totalChunks = Math.ceil(value.length / this.chunkSize);
        const chunkPromises: Promise<void>[] = [];

        for (let i = 0; i < totalChunks; i++) {
          const chunkSlice = value.slice(i * this.chunkSize, (i + 1) * this.chunkSize);
          chunkPromises.push(
            this.client.setItemAsync(`${key}__c${i}`, chunkSlice, this.storeOptions)
          );
        }

        await Promise.all(chunkPromises);

        const manifest: ChunkManifest = {
          __isSecureChunked: true,
          totalChunks,
        };

        await this.client.setItemAsync(key, JSON.stringify(manifest), this.storeOptions);
      } else {
        await this.client.setItemAsync(key, value, this.storeOptions);
      }
    } catch (error) {
      throw new JourneyRecoveryError(
        'STORAGE_UNAVAILABLE',
        `Failed to write secure key "${key}" to secure storage`,
        undefined,
        error
      );
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const raw = await this.client.getItemAsync(key, this.storeOptions);
      if (raw && raw.startsWith('{"__isSecureChunked":true')) {
        try {
          const manifest: ChunkManifest = JSON.parse(raw);
          const removePromises: Promise<void>[] = [];
          for (let i = 0; i < manifest.totalChunks; i++) {
            removePromises.push(this.client.deleteItemAsync(`${key}__c${i}`, this.storeOptions));
          }
          await Promise.all(removePromises);
        } catch {
          // Ignore manifest read error and proceed to delete primary key
        }
      }

      await this.client.deleteItemAsync(key, this.storeOptions);
    } catch (error) {
      throw new JourneyRecoveryError(
        'STORAGE_UNAVAILABLE',
        `Failed to delete secure key "${key}" from secure storage`,
        undefined,
        error
      );
    }
  }
}

