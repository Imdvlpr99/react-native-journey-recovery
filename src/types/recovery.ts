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
  | 'failed';

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
  status: RecoveryStatus;
  snapshot?: JourneySnapshot<T> | null;
  error?: JourneyRecoveryError;
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
}

