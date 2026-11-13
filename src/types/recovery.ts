import { JourneySnapshot } from './checkpoint';
import { JourneyRecoveryError } from '../utils/errors';

/**
 * High-level status of journey recovery.
 */
export type RecoveryStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'active'
  | 'restoring'
  | 'restored'
  | 'discarded'
  | 'expired'
  | 'invalid'
  | 'completed'
  | 'failed';

/**
 * What happened, for lifecycle event listeners.
 * - `saved` / `save_failed`: a checkpoint write finished or failed (immediate or auto-save)
 * - `cleared`: a journey's checkpoint was deleted through its handle
 * - `discarded`: the user chose not to resume (RecoveryManager.discard)
 * - `restored` / `migrated`: restore succeeded; `migrated` precedes it when a migration ran
 * - `expired` / `invalid` / `completed`: a check found a checkpoint that cannot be resumed
 */
export type RecoveryEventType =
  | 'saved'
  | 'save_failed'
  | 'cleared'
  | 'discarded'
  | 'restored'
  | 'migrated'
  | 'expired'
  | 'invalid'
  | 'completed';

/**
 * Result of checking whether a recoverable journey exists.
 */
export interface RecoveryInspectionResult<T = unknown> {
  available: boolean;
  status: RecoveryStatus;
  snapshot: JourneySnapshot<T> | null;
  error?: JourneyRecoveryError;
}

/**
 * Event emitted during recovery lifecycle transitions.
 */
export interface RecoveryEvent<T = unknown> {
  journeyId: string;
  /** What happened. Prefer this over `status` for new code. */
  type: RecoveryEventType;
  /** Status of the journey after the event. */
  status: RecoveryStatus;
  /**
   * Snapshot involved. Only `restored` events include `data`. `saved`, `migrated`, `expired`,
   * `invalid` and `completed` events carry metadata only (`data` is omitted), so listeners
   * such as analytics cannot leak user input by accident.
   */
  snapshot?: JourneySnapshot<T> | null;
  error?: JourneyRecoveryError;
  /** On `migrated` events: the version the data was migrated from. */
  fromVersion?: number;
  timestamp: number;
}

/**
 * State returned by the `useRecovery` hook.
 */
export interface RecoveryState<T> {
  available: boolean;
  status: RecoveryStatus;
  data: T | null;
  snapshot: JourneySnapshot<T> | null;
  updatedAt?: number;
  error: Error | null;
  restore: () => Promise<T>;
  discard: () => Promise<void>;
  /** Re-read storage and update this state. */
  refresh: () => Promise<void>;
}

