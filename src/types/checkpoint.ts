/**
 * Immutable snapshot model representing a persisted checkpoint.
 */
export interface JourneySnapshot<T = unknown> {
  /**
   * Unique identifier of the journey (e.g. 'checkout', 'onboarding').
   */
  id: string;

  /**
   * Schema version number for this journey's data payload.
   */
  version: number;

  /**
   * Timestamp in milliseconds when the journey was first checkpointed.
   */
  createdAt: number;

  /**
   * Timestamp in milliseconds when the checkpoint was last updated.
   */
  updatedAt: number;

  /**
   * Optional timestamp in milliseconds after which this checkpoint is considered expired.
   */
  expiresAt?: number;

  /**
   * Lifecycle status of this snapshot.
   */
  status: 'active' | 'completed';

  /**
   * Captured data payload.
   */
  data: T;

  /**
   * Lightweight integrity checksum of the serialized payload.
   */
  checksum?: string;
}

/**
 * Options passed when saving a checkpoint.
 */
export interface CheckpointOptions {
  /**
   * Fields to omit from persistence (e.g. sensitive tokens or passwords).
   * Use a top-level key (`'password'`) or a dot path (`'payment.cardNumber'`).
   * Paths pass through arrays: `'cards.cvv'` removes `cvv` from every item of `cards`.
   */
  exclude?: string[];

  /**
   * Custom expiration duration in milliseconds from now for this checkpoint.
   */
  expiry?: number;

  /**
   * Mark the journey status as 'completed' instead of 'active'.
   */
  completed?: boolean;
}

