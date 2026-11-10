import { StorageAdapter } from '../types/storage';
import { JourneySnapshot, CheckpointOptions } from '../types/checkpoint';
import { SnapshotSerializer } from './SnapshotSerializer';
import { JourneyRecoveryError } from '../utils/errors';

export interface CheckpointSaveMetadata {
  version: number;
  expiry?: number;
}

export interface CheckpointManagerOptions {
  enableHistory?: boolean;
  maxHistory?: number;
  userId?: string;
}

export class CheckpointManager {
  private keyPrefix: string;
  private historyKeyPrefix: string;
  private serializer: SnapshotSerializer;
  private queues: Map<string, Promise<void>> = new Map();
  private enableHistory: boolean;
  private maxHistory: number;
  private userId?: string;

  constructor(
    private storage: StorageAdapter,
    serializer?: SnapshotSerializer,
    keyPrefix = '@rn_journey:',
    options?: CheckpointManagerOptions
  ) {
    this.serializer = serializer ?? new SnapshotSerializer();
    this.keyPrefix = keyPrefix;
    this.historyKeyPrefix = `${keyPrefix}__history:`;
    this.enableHistory = options?.enableHistory ?? false;
    this.maxHistory = options?.maxHistory ?? 10;
    this.userId = options?.userId;
  }

  private getUserPrefix(userId?: string): string {
    const uid = userId ?? this.userId;
    return uid ? `u:${uid}:` : '';
  }

  getKey(journeyId: string, userId?: string): string {
    return `${this.keyPrefix}${this.getUserPrefix(userId)}${journeyId}`;
  }

  getHistoryKey(journeyId: string, userId?: string): string {
    return `${this.historyKeyPrefix}${this.getUserPrefix(userId)}${journeyId}`;
  }

  /**
   * Serializes async operations on a given journey to prevent race conditions.
   */
  private enqueue<T>(journeyId: string, op: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const current = this.queues.get(journeyId) ?? Promise.resolve();
      const next = current.then(async () => {
        try {
          const result = await op();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });

      this.queues.set(
        journeyId,
        next.catch(() => {})
      );
    });
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

      // Read prior checkpoint to preserve createdAt if exists
      let createdAt = now;
      try {
        const prior = await this.get<T>(journeyId);
        if (prior && prior.createdAt) {
          createdAt = prior.createdAt;
        }
      } catch {
        // If prior checkpoint read fails/corrupted, treat as new creation
        createdAt = now;
      }

      const expiryDuration = options?.expiry ?? metadata.expiry;
      const expiresAt = expiryDuration ? now + expiryDuration : undefined;
      const status = options?.completed ? 'completed' : 'active';

      const snapshot: JourneySnapshot<T> = {
        id: journeyId,
        version: metadata.version,
        createdAt,
        updatedAt: now,
        expiresAt,
        status,
        data,
      };

      const serialized = this.serializer.serialize(snapshot, {
        exclude: options?.exclude,
      });

      try {
        await this.storage.setItem(key, serialized);
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

      const deserialized = this.serializer.deserialize<T>(serialized);

      // Record in history stack if history tracking is enabled
      if (this.enableHistory) {
        try {
          const history = await this.getHistory<T>(journeyId);
          history.push(deserialized);
          if (history.length > this.maxHistory) {
            history.splice(0, history.length - this.maxHistory);
          }
          await this.storage.setItem(this.getHistoryKey(journeyId), JSON.stringify(history));
        } catch {
          // Failure to append history should not fail the primary checkpoint save
        }
      }

      return deserialized;
    });
  }

  /**
   * Retrieves the raw stored JSON string for a journey without deserialization.
   */
  async getRaw(journeyId: string): Promise<string | null> {
    const key = this.getKey(journeyId);
    return this.storage.getItem(key);
  }

  /**
   * Retrieves a snapshot for a journey, or null if not found.
   */
  async get<T>(journeyId: string): Promise<JourneySnapshot<T> | null> {
    const key = this.getKey(journeyId);
    let raw: string | null = null;
    try {
      raw = await this.storage.getItem(key);
    } catch (err) {
      if (err instanceof JourneyRecoveryError) {
        throw err;
      }
      throw new JourneyRecoveryError(
        'STORAGE_UNAVAILABLE',
        `Failed to retrieve checkpoint for journey "${journeyId}": ${err instanceof Error ? err.message : String(err)}`,
        journeyId,
        err
      );
    }

    if (!raw) {
      return null;
    }

    return this.serializer.deserialize<T>(raw);
  }

  /**
   * Retrieves the recorded checkpoint history for a journey.
   */
  async getHistory<T>(journeyId: string): Promise<JourneySnapshot<T>[]> {
    const historyKey = this.getHistoryKey(journeyId);
    try {
      const raw = await this.storage.getItem(historyKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as JourneySnapshot<T>[]) : [];
    } catch {
      return [];
    }
  }

  /**
   * Restores an earlier checkpoint from history and sets it as the active checkpoint.
   */
  async restoreFromHistory<T>(journeyId: string, index: number): Promise<JourneySnapshot<T>> {
    return this.enqueue(journeyId, async () => {
      const history = await this.getHistory<T>(journeyId);
      if (index < 0 || index >= history.length) {
        throw new JourneyRecoveryError(
          'JOURNEY_NOT_FOUND',
          `History index ${index} is out of bounds for journey "${journeyId}" (history size: ${history.length})`,
          journeyId
        );
      }

      const targetSnapshot = history[index];
      const serialized = this.serializer.serialize(targetSnapshot);
      await this.storage.setItem(this.getKey(journeyId), serialized);
      return targetSnapshot;
    });
  }

  /**
   * Removes a checkpoint and its history for a specific journey.
   */
  async delete(journeyId: string): Promise<void> {
    return this.enqueue(journeyId, async () => {
      const key = this.getKey(journeyId);
      const historyKey = this.getHistoryKey(journeyId);
      try {
        await this.storage.removeItem(key);
        if (this.enableHistory) {
          await this.storage.removeItem(historyKey);
        }
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
   * Clears all journeys associated with a specific user (or the current scoped user).
   * Ideal for logout handlers on shared devices.
   */
  async clearUserJourneys(targetUserId?: string): Promise<void> {
    const uid = targetUserId ?? this.userId;
    if (!uid || typeof this.storage.getAllKeys !== 'function') {
      return;
    }

    const userPrefix = `${this.keyPrefix}u:${uid}:`;
    const userHistoryPrefix = `${this.historyKeyPrefix}u:${uid}:`;

    const allKeys = await this.storage.getAllKeys();
    const keysToRemove = allKeys.filter(
      (k) => k.startsWith(userPrefix) || k.startsWith(userHistoryPrefix)
    );

    await Promise.all(keysToRemove.map((k) => this.storage.removeItem(k)));
  }

  /**
   * Deletes all journey checkpoints stored under the prefix.
   */
  async deleteAll(): Promise<void> {
    if (typeof this.storage.getAllKeys !== 'function') {
      return;
    }

    const allKeys = await this.storage.getAllKeys();
    const journeyKeys = allKeys.filter(
      (k) => k.startsWith(this.keyPrefix) && !k.startsWith(this.historyKeyPrefix)
    );

    await Promise.all(
      journeyKeys.map(async (key) => {
        const journeyId = key.slice(this.keyPrefix.length);
        await this.delete(journeyId);
      })
    );
  }
}
