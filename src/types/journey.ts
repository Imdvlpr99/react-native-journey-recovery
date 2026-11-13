import { CheckpointOptions, JourneySnapshot } from './checkpoint';
import { RecoveryStatus } from './recovery';

export type ExpiryMode = 'sliding' | 'absolute';

/**
 * Configuration options for a named journey.
 */
export interface JourneyOptions<T = unknown> {
  /**
   * Version of the data schema for this journey. Increments indicate breaking changes requiring migration.
   * Default: 1
   */
  version?: number;

  /**
   * Duration in milliseconds before a saved checkpoint expires.
   */
  expiry?: number;

  /**
   * How `expiry` is measured.
   * - `'sliding'` (default): from the most recent save, so active users never expire.
   * - `'absolute'`: from the journey's first save (`createdAt`), a fixed deadline.
   */
  expiryMode?: ExpiryMode;

  /**
   * Optional custom validation function. Returns true if data conforms to type T.
   * Runs on every save, and on restore against the current schema version
   * (after migration, never on older stored versions).
   */
  validate?: (data: unknown) => data is T;

  /**
   * Optional migration function invoked if a stored snapshot has an older version than registered.
   */
  migrate?: (oldData: unknown, oldVersion: number) => T | Promise<T>;

  /**
   * Automatically debounce-save checkpoints when checkpoint is called repeatedly.
   */
  autoSave?: boolean;

  /**
   * Debounce delay in milliseconds for auto-save.
   */
  debounceMs?: number;
}

/**
 * Handle returned to a component managing a journey.
 */
export interface JourneyHandle<T> {
  /**
   * Id of the registered journey.
   */
  id: string;

  /**
   * Current recovery status for this journey.
   */
  status: RecoveryStatus;

  /**
   * Saves or debounces a checkpoint.
   */
  checkpoint: (data: T, options?: CheckpointOptions) => Promise<JourneySnapshot<T>>;

  /**
   * Clears the active checkpoint for this journey and cancels pending auto-saves.
   */
  clear: () => Promise<void>;

  /**
   * Writes any pending auto-save now. Rejects if that write fails.
   * Resolves immediately when nothing is pending.
   */
  flush: () => Promise<void>;

  /**
   * The error from the most recent failed save, or null. Cleared by the next successful save.
   */
  error: Error | null;
}

