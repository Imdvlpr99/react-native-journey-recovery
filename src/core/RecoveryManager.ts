import { JourneyManager } from './JourneyManager';
import { LifecycleManager } from './LifecycleManager';
import { SnapshotValidator } from './SnapshotValidator';
import { getRecoveryDiagnostics, JourneyDiagnostics } from './RecoveryDiagnostics';
import { JourneySnapshot } from '../types/checkpoint';
import { RecoveryInspectionResult } from '../types/recovery';
import { JourneyRecoveryError } from '../utils/errors';

function withoutData<T>(snapshot: JourneySnapshot<T>): JourneySnapshot<T> {
  const { data: _omitted, ...meta } = snapshot;
  return meta as JourneySnapshot<T>;
}

export class RecoveryManager {
  private validator: SnapshotValidator;

  constructor(
    private journeyManager: JourneyManager,
    private lifecycleManager?: LifecycleManager,
    validator?: SnapshotValidator
  ) {
    this.validator = validator ?? new SnapshotValidator();
    // Make sure lifecycle listeners receive this engine's events.
    this.lifecycleManager?.attach(journeyManager);
  }

  /**
   * Inspects storage for a journey without restoring or altering it.
   *
   * Outcomes: `idle` (nothing stored), `available`, `expired`, `invalid` (corrupted, failed
   * validation, or saved by a newer schema version), `completed` (finished journeys are not
   * offered for resume), or `failed` (storage could not be read).
   */
  async check<T>(journeyId: string): Promise<RecoveryInspectionResult<T>> {
    let rawSnapshot: JourneySnapshot<T> | null = null;
    try {
      rawSnapshot = await this.journeyManager.getCheckpointManager().get<T>(journeyId);
    } catch (err) {
      const error =
        err instanceof JourneyRecoveryError
          ? err
          : new JourneyRecoveryError(
              'SNAPSHOT_CORRUPTED',
              `Failed to read snapshot: ${err instanceof Error ? err.message : String(err)}`,
              journeyId,
              err
            );
      if (error.code === 'STORAGE_UNAVAILABLE') {
        return { available: false, status: 'failed', snapshot: null, error };
      }
      this.notify(journeyId, 'invalid', null, error);
      return { available: false, status: 'invalid', snapshot: null, error };
    }

    if (!rawSnapshot) {
      // Idle means "nothing saved yet", not a failure.
      return { available: false, status: 'idle', snapshot: null };
    }

    const registered = this.journeyManager.getRegistry().get<T>(journeyId);
    const targetVersion = registered?.version ?? 1;
    const storedVersion = typeof rawSnapshot.version === 'number' ? rawSnapshot.version : 0;

    // Custom validation describes the current schema. Older versions are validated after migration.
    const validation = this.validator.validate<T>(
      rawSnapshot,
      storedVersion >= targetVersion ? registered : undefined
    );

    if (!validation.valid) {
      const status = validation.isExpired ? 'expired' : 'invalid';
      this.notify(journeyId, status, rawSnapshot, validation.error);
      return { available: false, status, snapshot: rawSnapshot, error: validation.error };
    }

    if (storedVersion > targetVersion) {
      const error = new JourneyRecoveryError(
        'SNAPSHOT_INVALID',
        registered
          ? `Checkpoint for journey "${journeyId}" was saved with schema version ${storedVersion}, newer than the registered version ${targetVersion}`
          : `Checkpoint for journey "${journeyId}" has schema version ${storedVersion}, but the journey is not registered. Call useJourney("${journeyId}", { version }) before restoring.`,
        journeyId
      );
      this.notify(journeyId, 'invalid', rawSnapshot, error);
      return { available: false, status: 'invalid', snapshot: rawSnapshot, error };
    }

    if (rawSnapshot.status === 'completed') {
      this.notify(journeyId, 'completed', rawSnapshot);
      return { available: false, status: 'completed', snapshot: validation.snapshot ?? rawSnapshot };
    }

    return {
      available: true,
      status: 'available',
      snapshot: validation.snapshot ?? rawSnapshot,
    };
  }

  private notify<T>(
    journeyId: string,
    type: 'expired' | 'invalid' | 'completed',
    snapshot: JourneySnapshot<T> | null,
    error?: JourneyRecoveryError
  ) {
    this.journeyManager.emit({
      journeyId,
      type,
      status: type,
      snapshot: snapshot ? (withoutData(snapshot) as JourneySnapshot<unknown>) : null,
      error,
      timestamp: Date.now(),
    });
  }

  /**
   * Validates, migrates (if needed), and restores a journey's data payload.
   */
  async restore<T>(journeyId: string): Promise<T> {
    const inspection = await this.check<T>(journeyId);

    if (!inspection.available) {
      throw (
        inspection.error ??
        new JourneyRecoveryError(
          'JOURNEY_NOT_FOUND',
          `Journey "${journeyId}" is not available for recovery (status: ${inspection.status})`,
          journeyId
        )
      );
    }

    // Handles any version schema migration (validated before it is saved back).
    const snapshot = await this.journeyManager.getMigratedSnapshot<T>(journeyId);
    if (!snapshot) {
      throw new JourneyRecoveryError(
        'JOURNEY_NOT_FOUND',
        `Failed to retrieve migrated snapshot for journey "${journeyId}"`,
        journeyId
      );
    }

    this.journeyManager.emit({
      journeyId,
      type: 'restored',
      status: 'restored',
      snapshot: snapshot as JourneySnapshot<unknown>,
      timestamp: Date.now(),
    });

    return snapshot.data;
  }

  /**
   * Returns deep diagnostics explaining whether and why a journey is recoverable.
   */
  async getDiagnostics<T = unknown>(journeyId: string): Promise<JourneyDiagnostics<T>> {
    return getRecoveryDiagnostics<T>(this.journeyManager, journeyId, this.validator);
  }

  /**
   * Discards any saved checkpoint for a journey (and its pending auto-save) and notifies listeners.
   */
  async discard(journeyId: string): Promise<void> {
    await this.journeyManager.clearJourney(journeyId);
    this.journeyManager.emit({ journeyId, type: 'discarded', status: 'idle', timestamp: Date.now() });
  }

}
