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
   * Maximum size of one stored value, in UTF-8 bytes. Larger values are split into chunks.
   * Expo SecureStore can reject values over 2048 bytes on Android. Default: 1800. 0 disables chunking.
   */
  chunkSize?: number;
  /**
   * Default SecureStore options passed to getItemAsync, setItemAsync, deleteItemAsync.
   */
  storeOptions?: SecureStoreOptions;
  /**
   * Keep an index of written keys so `getAllKeys` works (SecureStore cannot list keys).
   * Enables `clearAllJourneys()` and `clearUserJourneys()`. Default: true.
   */
  trackKeys?: boolean;
}

interface ChunkManifest {
  __isSecureChunked: true;
  totalChunks: number;
  /** Generation id of the chunk set. Absent in the legacy format (`<key>__c<i>`). */
  gen?: string;
}

const MANIFEST_PREFIX = '{"__isSecureChunked":true';
const INDEX_KEY = '__jr_index__';

/**
 * Maps any key onto SecureStore's allowed alphabet ([A-Za-z0-9._-]).
 * Every character outside [A-Za-z0-9.-] (including "_") becomes "_" + 4 hex digits, so the
 * mapping is injective and encoded keys never contain "__" (reserved for chunk and index keys).
 */
export function encodeSecureStoreKey(key: string): string {
  return key.replace(/[^A-Za-z0-9.-]/g, (c) => `_${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

function utf8Length(codePoint: number): number {
  if (codePoint < 0x80) return 1;
  if (codePoint < 0x800) return 2;
  if (codePoint < 0x10000) return 3;
  return 4;
}

function byteLength(value: string): number {
  let total = 0;
  for (const ch of value) total += utf8Length(ch.codePointAt(0) ?? 0);
  return total;
}

/** Splits on code-point boundaries so no chunk exceeds maxBytes or ends in half a character. */
function splitByBytes(value: string, maxBytes: number): string[] {
  const limit = Math.max(4, maxBytes);
  const chunks: string[] = [];
  let current = '';
  let currentBytes = 0;
  for (const ch of value) {
    const size = utf8Length(ch.codePointAt(0) ?? 0);
    if (currentBytes + size > limit) {
      chunks.push(current);
      current = '';
      currentBytes = 0;
    }
    current += ch;
    currentBytes += size;
  }
  if (current) chunks.push(current);
  return chunks;
}

let generationCounter = 0;
function newGeneration(): string {
  generationCounter = (generationCounter + 1) % 1_679_616; // 36^4
  return `${Date.now().toString(36)}${generationCounter.toString(36)}`;
}

/**
 * High-security storage adapter for Expo SecureStore (`expo-secure-store`)
 * and hardware-backed keychain/keystore storage.
 *
 * - Keys are encoded into SecureStore's allowed alphabet.
 * - Values larger than `chunkSize` bytes are split into chunks. A new chunk set is written
 *   before the manifest is switched to it, so an interrupted write keeps the previous value.
 * - Chunks of the previous value are deleted after each write, so no stale data is left behind.
 */
export class SecureStoreAdapter implements StorageAdapter {
  private chunkSize: number;
  private storeOptions?: SecureStoreOptions;
  private trackKeys: boolean;
  private index?: Set<string>;
  private indexQueue: Promise<void> = Promise.resolve();

  constructor(
    private client: SecureStoreLike,
    options?: SecureStoreAdapterOptions
  ) {
    this.chunkSize = options?.chunkSize ?? 1800;
    this.storeOptions = options?.storeOptions;
    this.trackKeys = options?.trackKeys ?? true;
  }

  /* ---------------- low-level value storage (chunk-aware) ---------------- */

  private chunkKey(encoded: string, manifest: ChunkManifest, i: number): string {
    return manifest.gen ? `${encoded}__g${manifest.gen}c${i}` : `${encoded}__c${i}`;
  }

  private parseManifest(raw: string | null): ChunkManifest | null {
    if (!raw || !raw.startsWith(MANIFEST_PREFIX)) return null;
    try {
      const parsed = JSON.parse(raw) as ChunkManifest;
      return parsed.__isSecureChunked && Number.isInteger(parsed.totalChunks) ? parsed : null;
    } catch {
      return null;
    }
  }

  private async deleteChunks(encoded: string, manifest: ChunkManifest): Promise<void> {
    await Promise.all(
      Array.from({ length: manifest.totalChunks }, (_, i) =>
        this.client.deleteItemAsync(this.chunkKey(encoded, manifest, i), this.storeOptions)
      )
    );
  }

  private async readValue(encoded: string, displayKey: string): Promise<string | null> {
    const raw = await this.client.getItemAsync(encoded, this.storeOptions);
    if (!raw) return null;

    const manifest = this.parseManifest(raw);
    if (!manifest) return raw;

    const chunks = await Promise.all(
      Array.from({ length: manifest.totalChunks }, (_, i) =>
        this.client.getItemAsync(this.chunkKey(encoded, manifest, i), this.storeOptions)
      )
    );
    if (chunks.some((c) => c === null)) {
      throw new JourneyRecoveryError(
        'SNAPSHOT_CORRUPTED',
        `Incomplete chunk sequence for secure key "${displayKey}"`
      );
    }
    return chunks.join('');
  }

  private async writeValue(encoded: string, value: string): Promise<void> {
    const previous = this.parseManifest(await this.client.getItemAsync(encoded, this.storeOptions));

    if (this.chunkSize > 0 && byteLength(value) > this.chunkSize) {
      const chunks = splitByBytes(value, this.chunkSize);
      const manifest: ChunkManifest = { __isSecureChunked: true, totalChunks: chunks.length, gen: newGeneration() };
      await Promise.all(
        chunks.map((chunk, i) => this.client.setItemAsync(this.chunkKey(encoded, manifest, i), chunk, this.storeOptions))
      );
      // Switch to the new chunk set only once every chunk is written.
      await this.client.setItemAsync(encoded, JSON.stringify(manifest), this.storeOptions);
    } else {
      await this.client.setItemAsync(encoded, value, this.storeOptions);
    }

    if (previous) {
      // Best effort: the value is already replaced; leftovers are retried on the next write.
      await this.deleteChunks(encoded, previous).catch(() => {});
    }
  }

  private async deleteValue(encoded: string): Promise<void> {
    const manifest = this.parseManifest(await this.client.getItemAsync(encoded, this.storeOptions));
    if (manifest) await this.deleteChunks(encoded, manifest);
    await this.client.deleteItemAsync(encoded, this.storeOptions);
  }

  /* ---------------- key index ---------------- */

  private async loadIndex(): Promise<Set<string>> {
    if (this.index) return this.index;
    let keys: string[] = [];
    try {
      const raw = await this.readValue(INDEX_KEY, INDEX_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) keys = parsed.filter((k): k is string => typeof k === 'string');
    } catch {
      // An unreadable index is rebuilt from subsequent writes.
    }
    this.index = new Set(keys);
    return this.index;
  }

  private updateIndex(key: string, present: boolean): Promise<void> {
    if (!this.trackKeys) return Promise.resolve();
    const run = this.indexQueue.then(async () => {
      const index = await this.loadIndex();
      if (index.has(key) === present) return;
      if (present) index.add(key);
      else index.delete(key);
      await this.writeValue(INDEX_KEY, JSON.stringify(Array.from(index)));
    });
    this.indexQueue = run.catch(() => {});
    return run;
  }

  /* ---------------- StorageAdapter ---------------- */

  async getItem(key: string): Promise<string | null> {
    try {
      return await this.readValue(encodeSecureStoreKey(key), key);
    } catch (error) {
      if (error instanceof JourneyRecoveryError) throw error;
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
      await this.writeValue(encodeSecureStoreKey(key), value);
      await this.updateIndex(key, true);
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
      await this.deleteValue(encodeSecureStoreKey(key));
      await this.updateIndex(key, false);
    } catch (error) {
      throw new JourneyRecoveryError(
        'STORAGE_UNAVAILABLE',
        `Failed to delete secure key "${key}" from secure storage`,
        undefined,
        error
      );
    }
  }

  /**
   * Keys written through this adapter (requires `trackKeys`, on by default).
   * Keys written before the index existed are not listed.
   */
  async getAllKeys(): Promise<string[]> {
    if (!this.trackKeys) return [];
    await this.indexQueue;
    return Array.from(await this.loadIndex());
  }
}
