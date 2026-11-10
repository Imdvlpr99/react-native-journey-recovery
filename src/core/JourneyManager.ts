import { CheckpointManager } from './CheckpointManager';
import { JourneyRegistry, RegisterOptions } from './JourneyRegistry';
import { SnapshotValidator } from './SnapshotValidator';
import { JourneyOptions, JourneyHandle } from '../types/journey';
import { JourneySnapshot, CheckpointOptions } from '../types/checkpoint';
import { JourneyRecoveryError } from '../utils/errors';
import { debounce, DebouncedFunction } from '../utils/debounce';

export class JourneyManager {
  private registry: JourneyRegistry;
  private validator: SnapshotValidator;
  private autoSaveMap = new Map<string, DebouncedFunction<(data: any, options?: CheckpointOptions) => Promise<any>>>();

  constructor(
    private checkpointManager: CheckpointManager,
    registry?: JourneyRegistry,
    validator?: SnapshotValidator
  ) {
    this.registry = registry ?? new JourneyRegistry();
    this.validator = validator ?? new SnapshotValidator();
  }

  getRegistry(): JourneyRegistry {
    return this.registry;
  }

  getCheckpointManager(): CheckpointManager {
    return this.checkpointManager;
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

    let debouncedSave: DebouncedFunction<(data: T, opts?: CheckpointOptions) => Promise<JourneySnapshot<T>>> | null = null;
    if (mergedOptions.autoSave) {
      const wait = mergedOptions.debounceMs ?? 500;
      debouncedSave = debounce(
        (data: T, opts?: CheckpointOptions) => this.checkpoint(id, data, opts),
        wait
      );
      this.autoSaveMap.set(id, debouncedSave as any);
    }

    const handle: JourneyHandle<T> = {
      id,
      status: 'idle',
      checkpoint: async (data: T, opts?: CheckpointOptions): Promise<JourneySnapshot<T>> => {
        if (mergedOptions.autoSave && debouncedSave) {
          debouncedSave(data, opts);
          // Return an optimistic or currently-known snapshot structure for debounced calls
          return {
            id,
            version: mergedOptions.version ?? 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: opts?.completed ? 'completed' : 'active',
            data,
          };
        }
        return this.checkpoint(id, data, opts);
      },
      clear: async (): Promise<void> => {
        if (debouncedSave) {
          debouncedSave.cancel();
          this.autoSaveMap.delete(id);
        }
        await this.clearJourney(id);
      },
    };

    return handle;
  }

  /**
   * Directly saves a checkpoint for a journey.
   */
  async checkpoint<T>(
    id: string,
    data: T,
    options?: CheckpointOptions
  ): Promise<JourneySnapshot<T>> {
    const registered = this.registry.get<T>(id) ?? { version: 1 };

    if (registered.validate) {
      const isValid = registered.validate(data);
      if (!isValid) {
        throw new JourneyRecoveryError(
          'SNAPSHOT_INVALID',
          `Data for journey "${id}" failed validation`,
          id
        );
      }
    }

    const version = registered.version ?? 1;
    const expiry = options?.expiry ?? registered.expiry;

    return this.checkpointManager.save(id, data, { version, expiry }, options);
  }

  /**
   * Retrieves and migrates (if necessary) the stored snapshot for a journey.
   */
  async getMigratedSnapshot<T>(id: string): Promise<JourneySnapshot<T> | null> {
    const snapshot = await this.checkpointManager.get<unknown>(id);
    if (!snapshot) {
      return null;
    }

    const registered = this.registry.get<T>(id);
    const targetVersion = registered?.version ?? 1;

    if (snapshot.version < targetVersion) {
      if (!registered?.migrate) {
        throw new JourneyRecoveryError(
          'MIGRATION_FAILED',
          `Cannot migrate journey "${id}" from version ${snapshot.version} to ${targetVersion}: no migration function provided`,
          id
        );
      }

      try {
        const migratedData = await registered.migrate(snapshot.data, snapshot.version);
        // Persist migrated snapshot
        const updatedSnapshot = await this.checkpointManager.save(
          id,
          migratedData,
          { version: targetVersion, expiry: registered.expiry }
        );
        return updatedSnapshot;
      } catch (err) {
        throw new JourneyRecoveryError(
          'MIGRATION_FAILED',
          `Migration failed for journey "${id}": ${err instanceof Error ? err.message : String(err)}`,
          id,
          err
        );
      }
    }

    return snapshot as JourneySnapshot<T>;
  }

  /**
   * Flushes any pending auto-save debounce for a journey or all journeys.
   */
  flushPending(journeyId?: string): void {
    if (journeyId) {
      const autoSave = this.autoSaveMap.get(journeyId);
      if (autoSave) {
        autoSave.flush();
      }
    } else {
      for (const autoSave of this.autoSaveMap.values()) {
        autoSave.flush();
      }
    }
  }

  /**
   * Clears a journey checkpoint from storage.
   */
  async clearJourney(id: string): Promise<void> {
    await this.checkpointManager.delete(id);
  }

  /**
   * Clears all journey checkpoints from storage.
   */
  async clearAllJourneys(): Promise<void> {
    await this.checkpointManager.deleteAll();
  }
}
