import { CheckpointManager } from './CheckpointManager';
import { JourneyRegistry, RegisterOptions } from './JourneyRegistry';
import { JourneyOptions, JourneyHandle } from '../types/journey';
import { JourneySnapshot, CheckpointOptions } from '../types/checkpoint';
import { RecoveryEvent, RecoveryStatus } from '../types/recovery';
import { JourneyRecoveryError } from '../utils/errors';
import { debounce, DebouncedFunction } from '../utils/debounce';

export type JourneyEventSink = (event: RecoveryEvent<unknown>) => void;

export interface JourneyState {
  status: RecoveryStatus;
  error: JourneyRecoveryError | null;
}

type AutoSave = DebouncedFunction<(data: unknown, options?: CheckpointOptions) => Promise<JourneySnapshot<unknown>>> & {
  waitMs: number;
};

const IDLE: JourneyState = { status: 'idle', error: null };

function toRecoveryError(err: unknown, journeyId: string): JourneyRecoveryError {
  if (err instanceof JourneyRecoveryError) return err;
  return new JourneyRecoveryError(
    'STORAGE_UNAVAILABLE',
    `Failed to save checkpoint for journey "${journeyId}": ${err instanceof Error ? err.message : String(err)}`,
    journeyId,
    err
  );
}

/** Snapshot without its data payload, for events that must not leak user input. */
function withoutData<T>(snapshot: JourneySnapshot<T>): JourneySnapshot<T> {
  const { data: _omitted, ...meta } = snapshot;
  return meta as JourneySnapshot<T>;
}

export class JourneyManager {
  private registry: JourneyRegistry;
  private autoSaveMap = new Map<string, AutoSave>();
  private states = new Map<string, JourneyState>();
  private sinks = new Set<JourneyEventSink>();

  constructor(
    private checkpointManager: CheckpointManager,
    registry?: JourneyRegistry
  ) {
    this.registry = registry ?? new JourneyRegistry();
  }

  getRegistry(): JourneyRegistry {
    return this.registry;
  }

  getCheckpointManager(): CheckpointManager {
    return this.checkpointManager;
  }

  /** Receives lifecycle events produced by this manager. Returns an unsubscribe function. */
  addEventSink(sink: JourneyEventSink): () => void {
    this.sinks.add(sink);
    return () => {
      this.sinks.delete(sink);
    };
  }

  /** @internal Emits an event to every sink. Used by RecoveryManager too. */
  emit(event: RecoveryEvent<unknown>): void {
    for (const sink of this.sinks) sink(event);
  }

  /** Current save status and last error for a journey, shared by every handle for that id. */
  getJourneyState(id: string): JourneyState {
    return this.states.get(id) ?? IDLE;
  }

  private setState(id: string, status: RecoveryStatus, error: JourneyRecoveryError | null = null) {
    this.states.set(id, { status, error });
  }

  /**
   * Registers a named journey and returns a handle for checkpointing and clearing.
   */
  registerJourney<T>(
    id: string,
    options?: JourneyOptions<T>,
    registerOptions?: RegisterOptions
  ): JourneyHandle<T> {
    this.registry.register(id, options, registerOptions);

    const mergedOptions = options ?? { version: 1 };
    const existing = this.autoSaveMap.get(id);

    if (mergedOptions.autoSave) {
      const wait = mergedOptions.debounceMs ?? 500;
      if (!existing || existing.waitMs !== wait) {
        // Write anything still pending under the old settings before replacing them.
        existing?.flush()?.catch(() => {});
        const debounced = debounce(
          (data: unknown, opts?: CheckpointOptions) => this.checkpoint(id, data, opts),
          wait
        ) as AutoSave;
        debounced.waitMs = wait;
        this.autoSaveMap.set(id, debounced);
      }
    } else if (existing) {
      existing.flush()?.catch(() => {});
      this.autoSaveMap.delete(id);
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const manager = this;

    return {
      id,
      get status() {
        return manager.getJourneyState(id).status;
      },
      get error() {
        return manager.getJourneyState(id).error;
      },
      checkpoint: async (data: T, opts?: CheckpointOptions): Promise<JourneySnapshot<T>> => {
        const debounced = manager.autoSaveMap.get(id);
        if (mergedOptions.autoSave && debounced) {
          manager.setState(id, 'active', manager.getJourneyState(id).error);
          debounced(data, opts);
          // Preview of what will be written once the debounce settles (no checksum yet).
          const now = Date.now();
          return {
            id,
            version: mergedOptions.version ?? 1,
            createdAt: now,
            updatedAt: now,
            status: opts?.completed ? 'completed' : 'active',
            data,
          };
        }
        return manager.checkpoint(id, data, opts);
      },
      clear: async (): Promise<void> => {
        await manager.clearJourney(id);
        manager.emit({ journeyId: id, type: 'cleared', status: 'idle', timestamp: Date.now() });
      },
      flush: () => manager.flushPending(id),
    };
  }

  /**
   * Validates and saves a checkpoint immediately. Emits `saved` or `save_failed`.
   */
  async checkpoint<T>(
    id: string,
    data: T,
    options?: CheckpointOptions
  ): Promise<JourneySnapshot<T>> {
    const registered = this.registry.get<T>(id) ?? { version: 1 };
    this.setState(id, 'active', this.getJourneyState(id).error);

    try {
      if (registered.validate) {
        let isValid: boolean;
        try {
          isValid = registered.validate(data);
        } catch (err) {
          throw new JourneyRecoveryError(
            'SNAPSHOT_INVALID',
            `Validation for journey "${id}" threw: ${err instanceof Error ? err.message : String(err)}`,
            id,
            err
          );
        }
        if (!isValid) {
          throw new JourneyRecoveryError('SNAPSHOT_INVALID', `Data for journey "${id}" failed validation`, id);
        }
      }

      const snapshot = await this.checkpointManager.save(
        id,
        data,
        {
          version: registered.version ?? 1,
          expiry: options?.expiry ?? registered.expiry,
          expiryMode: registered.expiryMode,
        },
        options
      );

      this.setState(id, 'active', null);
      this.emit({
        journeyId: id,
        type: 'saved',
        status: 'active',
        snapshot: withoutData(snapshot) as JourneySnapshot<unknown>,
        timestamp: Date.now(),
      });
      return snapshot;
    } catch (err) {
      const error = toRecoveryError(err, id);
      this.setState(id, 'failed', error);
      this.emit({ journeyId: id, type: 'save_failed', status: 'failed', error, timestamp: Date.now() });
      throw error;
    }
  }

  /**
   * Retrieves and migrates (if necessary) the stored snapshot for a journey.
   * Migrated data is validated before it is saved back.
   */
  async getMigratedSnapshot<T>(id: string): Promise<JourneySnapshot<T> | null> {
    const snapshot = await this.checkpointManager.get<unknown>(id);
    if (!snapshot) {
      return null;
    }

    const registered = this.registry.get<T>(id);
    const targetVersion = registered?.version ?? 1;

    if (snapshot.version > targetVersion) {
      throw new JourneyRecoveryError(
        'SNAPSHOT_INVALID',
        `Checkpoint for journey "${id}" has version ${snapshot.version}, newer than the registered version ${targetVersion}`,
        id
      );
    }

    if (snapshot.version < targetVersion) {
      if (!registered?.migrate) {
        throw new JourneyRecoveryError(
          'MIGRATION_FAILED',
          `Cannot migrate journey "${id}" from version ${snapshot.version} to ${targetVersion}: no migration function provided`,
          id
        );
      }

      let migratedData: T;
      try {
        migratedData = await registered.migrate(snapshot.data, snapshot.version);
      } catch (err) {
        throw new JourneyRecoveryError(
          'MIGRATION_FAILED',
          `Migration failed for journey "${id}": ${err instanceof Error ? err.message : String(err)}`,
          id,
          err
        );
      }

      if (registered.validate) {
        let isValid = false;
        try {
          isValid = registered.validate(migratedData);
        } catch {
          isValid = false;
        }
        if (!isValid) {
          throw new JourneyRecoveryError(
            'MIGRATION_FAILED',
            `Migrated data for journey "${id}" failed validation for version ${targetVersion}`,
            id
          );
        }
      }

      // Save at the new version, keeping the original deadline and completion state.
      const updated = await this.checkpointManager.save(
        id,
        migratedData,
        { version: targetVersion, expiresAt: snapshot.expiresAt },
        { completed: snapshot.status === 'completed' }
      );
      this.emit({
        journeyId: id,
        type: 'migrated',
        status: 'restoring',
        fromVersion: snapshot.version,
        snapshot: withoutData(updated) as JourneySnapshot<unknown>,
        timestamp: Date.now(),
      });
      return updated;
    }

    return snapshot as JourneySnapshot<T>;
  }

  /**
   * Writes pending auto-saves for one journey, or for all of them.
   * Rejects with the first failure; other journeys are still flushed.
   */
  async flushPending(journeyId?: string): Promise<void> {
    const targets = journeyId
      ? [this.autoSaveMap.get(journeyId)].filter((d): d is AutoSave => Boolean(d))
      : Array.from(this.autoSaveMap.values());

    const results = await Promise.allSettled(targets.map((d) => Promise.resolve(d.flush())));
    const failure = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failure) {
      throw failure.reason;
    }
  }

  /**
   * Clears a journey checkpoint from storage and cancels its pending auto-save.
   * Auto-save keeps working for later checkpoints.
   */
  async clearJourney(id: string): Promise<void> {
    this.autoSaveMap.get(id)?.cancel();
    await this.checkpointManager.delete(id);
    this.setState(id, 'idle');
  }

  /**
   * Clears all journey checkpoints from storage.
   */
  async clearAllJourneys(): Promise<void> {
    for (const debounced of this.autoSaveMap.values()) debounced.cancel();
    await this.checkpointManager.deleteAll();
    this.states.clear();
  }
}
