import { JourneyManager } from './JourneyManager';
import { LifecycleManager } from './LifecycleManager';
import { SnapshotValidator } from './SnapshotValidator';
import { RecoveryInspectionResult } from '../types/recovery';
import { JourneyRecoveryError } from '../utils/errors';

export class RecoveryManager {
  private validator: SnapshotValidator;

  constructor(
    private journeyManager: JourneyManager,
    private lifecycleManager?: LifecycleManager,
    validator?: SnapshotValidator
  ) {
    this.validator = validator ?? new SnapshotValidator();
  }

  /**
   * Inspects storage for a journey without restoring or altering it.
   */
  async check<T>(journeyId: string): Promise<RecoveryInspectionResult<T>> {
    let rawSnapshot: any = null;
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
      return {
        available: false,
        status: 'invalid',
        snapshot: null,
        error,
      };
    }

    if (!rawSnapshot) {
      return {
        available: false,
        status: 'idle',
        snapshot: null,
        error: new JourneyRecoveryError(
          'JOURNEY_NOT_FOUND',
          `No checkpoint found for journey "${journeyId}"`,
          journeyId
        ),
      };
    }

    const registeredOptions = this.journeyManager.getRegistry().get<T>(journeyId);
    const validation = this.validator.validate<T>(rawSnapshot, registeredOptions);

    if (!validation.valid) {
      if (validation.isExpired) {
        return {
          available: false,
          status: 'expired',
          snapshot: rawSnapshot,
          error: validation.error,
        };
      }

      return {
        available: false,
        status: 'invalid',
        snapshot: rawSnapshot,
        error: validation.error,
      };
    }

    return {
      available: true,
      status: 'available',
      snapshot: validation.snapshot!,
    };
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

    // Handles any version schema migration
    const snapshot = await this.journeyManager.getMigratedSnapshot<T>(journeyId);
    if (!snapshot) {
      throw new JourneyRecoveryError(
        'JOURNEY_NOT_FOUND',
        `Failed to retrieve migrated snapshot for journey "${journeyId}"`,
        journeyId
      );
    }

    this.lifecycleManager?.emit({
      journeyId,
      status: 'restored',
      snapshot,
      timestamp: Date.now(),
    });

    return snapshot.data;
  }

  /**
   * Discards any saved checkpoint for a journey and notifies listeners.
   */
  async discard(journeyId: string): Promise<void> {
    await this.journeyManager.clearJourney(journeyId);

    this.lifecycleManager?.emit({
      journeyId,
      status: 'idle',
      timestamp: Date.now(),
    });
  }
}
