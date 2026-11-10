import { StorageAdapter } from '../types/storage';
import { JourneySnapshot, CheckpointOptions } from '../types/checkpoint';
import { SnapshotSerializer } from './SnapshotSerializer';
import { JourneyRecoveryError } from '../utils/errors';

export interface CheckpointSaveMetadata {
  version: number;
  expiry?: number;
}

export class CheckpointManager {
  private keyPrefix: string;
  private serializer: SnapshotSerializer;
  private queues: Map<string, Promise<void>> = new Map();

  constructor(
    private storage: StorageAdapter,
    serializer?: SnapshotSerializer,
    keyPrefix = '@rn_journey:'
  ) {
    this.serializer = serializer ?? new SnapshotSerializer();
    this.keyPrefix = keyPrefix;
  }

  private getKey(journeyId: string): string {
    return `${this.keyPrefix}${journeyId}`;
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
    metadata: CheckpointSaveMetadata,
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

      return this.serializer.deserialize<T>(serialized);
    });
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
   * Removes a checkpoint for a specific journey.
   */
  async delete(journeyId: string): Promise<void> {
    return this.enqueue(journeyId, async () => {
      const key = this.getKey(journeyId);
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
   * Deletes all journey checkpoints stored under the prefix.
   */
  async deleteAll(): Promise<void> {
    if (typeof this.storage.getAllKeys !== 'function') {
      return;
    }

    const allKeys = await this.storage.getAllKeys();
    const journeyKeys = allKeys.filter((k) => k.startsWith(this.keyPrefix));

    await Promise.all(
      journeyKeys.map(async (key) => {
        const journeyId = key.slice(this.keyPrefix.length);
        await this.delete(journeyId);
      })
    );
  }
}
