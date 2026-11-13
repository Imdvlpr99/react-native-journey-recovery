import { StorageAdapter } from '../types/storage';
import { JourneySnapshot, CheckpointOptions } from '../types/checkpoint';
import { ExpiryMode } from '../types/journey';
import { SnapshotSerializer } from './SnapshotSerializer';
import { JourneyRecoveryError } from '../utils/errors';
import { encodeKeySegment } from '../utils/keys';

export interface CheckpointSaveMetadata {
  version: number;
  /** Expiry duration in milliseconds. `0` expires immediately; omit for no expiry. */
  expiry?: number;
  /** How `expiry` is measured. Default `'sliding'` (from this save). */
  expiryMode?: ExpiryMode;
  /** Absolute expiry timestamp. Takes precedence over `expiry` (used to preserve it across migrations). */
  expiresAt?: number;
}

/**
 * Transforms the serialized snapshot on its way to and from storage.
 * Use it to encrypt at rest, or to sign and verify (HMAC) for real tamper detection.
 * `decode` should throw if the stored value cannot be trusted.
 */
export interface SnapshotTransform {
  encode(serialized: string): string | Promise<string>;
  decode(stored: string): string | Promise<string>;
}

export interface CheckpointManagerOptions {
  userId?: string;
  maxSizeBytes?: number;
  transform?: SnapshotTransform;
}

export class CheckpointManager {
  private keyPrefix: string;
  private serializer: SnapshotSerializer;
  private queues: Map<string, Promise<void>> = new Map();
  private createdAtCache: Map<string, number> = new Map();
  private userId?: string;
  private transform?: SnapshotTransform;

  constructor(
    private storage: StorageAdapter,
    serializerOrOptions?: SnapshotSerializer | CheckpointManagerOptions,
    keyPrefix = '@rn_journey:',
    options?: CheckpointManagerOptions
  ) {
    let effectiveSerializer: SnapshotSerializer | undefined;
    let effectiveOptions: CheckpointManagerOptions | undefined = options;

    if (serializerOrOptions && typeof (serializerOrOptions as SnapshotSerializer).serialize !== 'function') {
      effectiveOptions = { ...(serializerOrOptions as CheckpointManagerOptions), ...options };
    } else {
      effectiveSerializer = serializerOrOptions as SnapshotSerializer | undefined;
    }

    this.serializer =
      effectiveSerializer ??
      new SnapshotSerializer({
        maxSizeBytes: effectiveOptions?.maxSizeBytes,
      });
    this.keyPrefix = keyPrefix;
    this.userId = effectiveOptions?.userId;
    this.transform = effectiveOptions?.transform;
  }

  private getUserPrefix(userId?: string): string {
    const uid = userId ?? this.userId;
    return uid ? `u:${encodeKeySegment(uid)}:` : '';
  }

  /**
   * Storage key for a journey. User and journey ids are escaped so that ":" in an id
   * can never address another user's or another journey's checkpoint.
   */
  getKey(journeyId: string, userId?: string): string {
    return `${this.keyPrefix}${this.getUserPrefix(userId)}${encodeKeySegment(journeyId)}`;
  }

  /**
   * Serializes async operations on a given journey to prevent race conditions.
   */
  private enqueue<T>(journeyId: string, op: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(journeyId) ?? Promise.resolve();
    const result = previous.then(op);
    const tail = result.then(
      () => undefined,
      () => undefined
    );
    this.queues.set(journeyId, tail);
    // Drop the entry once this is the last queued operation, so the map does not grow unbounded.
    tail.then(() => {
      if (this.queues.get(journeyId) === tail) {
        this.queues.delete(journeyId);
      }
    });
    return result;
  }

  private async readRaw(key: string, journeyId: string): Promise<string | null> {
    let stored: string | null;
    try {
      stored = await this.storage.getItem(key);
    } catch (err) {
      if (err instanceof JourneyRecoveryError) throw err;
      throw new JourneyRecoveryError(
        'STORAGE_UNAVAILABLE',
        `Failed to retrieve checkpoint for journey "${journeyId}": ${err instanceof Error ? err.message : String(err)}`,
        journeyId,
        err
      );
    }
    if (!stored || !this.transform) return stored;
    try {
      return await this.transform.decode(stored);
    } catch (err) {
      throw new JourneyRecoveryError(
        'SNAPSHOT_CORRUPTED',
        `Stored checkpoint for journey "${journeyId}" failed to decode: ${err instanceof Error ? err.message : String(err)}`,
        journeyId,
        err
      );
    }
  }

  private computeExpiresAt(metadata: CheckpointSaveMetadata, options: CheckpointOptions | undefined, now: number, createdAt: number) {
    if (options?.expiry === undefined && metadata.expiresAt !== undefined) {
      return metadata.expiresAt;
    }
    const duration = options?.expiry ?? metadata.expiry;
    if (duration === undefined || duration === null) return undefined;
    const from = metadata.expiryMode === 'absolute' ? createdAt : now;
    return from + duration;
  }

  /**
   * Persists a checkpoint for a journey, serializing concurrent writes.
   */
  async save<T>(
    journeyId: string,
    data: T,
    metadata: CheckpointSaveMetadata = { version: 1 },
    options?: CheckpointOptions
  ): Promise<JourneySnapshot<T>> {
    return this.enqueue(journeyId, async () => {
      const key = this.getKey(journeyId);
      const now = Date.now();

      // Keep createdAt across saves. Read the previous snapshot once, then cache it.
      let createdAt = this.createdAtCache.get(key);
      if (createdAt === undefined) {
        createdAt = now;
        try {
          const prior = await this.get<T>(journeyId);
          if (prior && typeof prior.createdAt === 'number') {
            createdAt = prior.createdAt;
          }
        } catch {
          // Unreadable prior checkpoint: treat this save as a fresh start.
        }
      }

      const snapshot: JourneySnapshot<T> = {
        id: journeyId,
        version: metadata.version,
        createdAt,
        updatedAt: now,
        expiresAt: this.computeExpiresAt(metadata, options, now, createdAt),
        status: options?.completed ? 'completed' : 'active',
        data,
      };

      const serialized = this.serializer.serialize(snapshot, {
        exclude: options?.exclude,
      });

      try {
        const stored = this.transform ? await this.transform.encode(serialized) : serialized;
        await this.storage.setItem(key, stored);
      } catch (err) {
        if (err instanceof JourneyRecoveryError) {
          throw err;
        }
        throw new JourneyRecoveryError(
          'STORAGE_UNAVAILABLE',
          `Failed to persist checkpoint for journey "${journeyId}": ${err instanceof Error ? err.message : String(err)}`,
          journeyId,
          err
        );
      }
      this.createdAtCache.set(key, createdAt);

      // Return what was persisted, including checksum and any field exclusions.
      const { _formatVersion: _ignored, ...persisted } = JSON.parse(serialized) as JourneySnapshot<T> & {
        _formatVersion?: number;
      };
      return persisted as JourneySnapshot<T>;
    });
  }

  /**
   * Retrieves the stored JSON string for a journey (after the transform's decode, if any).
   */
  async getRaw(journeyId: string): Promise<string | null> {
    return this.readRaw(this.getKey(journeyId), journeyId);
  }

  /**
   * Retrieves a snapshot for a journey, or null if not found.
   */
  async get<T>(journeyId: string): Promise<JourneySnapshot<T> | null> {
    const key = this.getKey(journeyId);
    const raw = await this.readRaw(key, journeyId);
    if (!raw) {
      this.createdAtCache.delete(key);
      return null;
    }
    const snapshot = this.serializer.deserialize<T>(raw);
    if (typeof snapshot.createdAt === 'number') {
      this.createdAtCache.set(key, snapshot.createdAt);
    }
    return snapshot;
  }

  /**
   * Removes a checkpoint for a specific journey.
   */
  async delete(journeyId: string): Promise<void> {
    return this.enqueue(journeyId, async () => {
      const key = this.getKey(journeyId);
      this.createdAtCache.delete(key);
      try {
        await this.storage.removeItem(key);
      } catch (err) {
        if (err instanceof JourneyRecoveryError) {
          throw err;
        }
        throw new JourneyRecoveryError(
          'STORAGE_UNAVAILABLE',
          `Failed to delete checkpoint for journey "${journeyId}": ${err instanceof Error ? err.message : String(err)}`,
          journeyId,
          err
        );
      }
    });
  }

  /**
   * Alias for delete() to clear a checkpoint.
   */
  async clear(journeyId: string): Promise<void> {
    return this.delete(journeyId);
  }

  /**
   * Clears all journeys associated with a specific user (or the current scoped user).
   * Ideal for logout handlers on shared devices. Requires an adapter with `getAllKeys`.
   */
  async clearUserJourneys(targetUserId?: string): Promise<void> {
    const uid = targetUserId ?? this.userId;
    if (!uid || typeof this.storage.getAllKeys !== 'function') {
      return;
    }

    const userPrefix = `${this.keyPrefix}${this.getUserPrefix(uid)}`;
    const allKeys = await this.storage.getAllKeys();
    const keysToRemove = allKeys.filter((k) => k.startsWith(userPrefix));
    keysToRemove.forEach((k) => this.createdAtCache.delete(k));
    await Promise.all(keysToRemove.map((k) => this.storage.removeItem(k)));
  }

  /**
   * Deletes all journey checkpoints stored under the prefix, for every user.
   * Requires an adapter with `getAllKeys`.
   */
  async deleteAll(): Promise<void> {
    if (typeof this.storage.getAllKeys !== 'function') {
      return;
    }

    const allKeys = await this.storage.getAllKeys();
    const journeyKeys = allKeys.filter((k) => k.startsWith(this.keyPrefix));
    this.createdAtCache.clear();

    // Remove directly by key to avoid re-applying the user prefix inside getKey()
    await Promise.all(journeyKeys.map((key) => this.storage.removeItem(key)));
  }
}
