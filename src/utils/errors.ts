export type JourneyErrorCode =
  | 'JOURNEY_NOT_FOUND'
  | 'JOURNEY_EXPIRED'
  | 'SNAPSHOT_INVALID'
  | 'SNAPSHOT_CORRUPTED'
  | 'MIGRATION_FAILED'
  | 'STORAGE_UNAVAILABLE'
  | 'SERIALIZATION_FAILED'
  | 'JOURNEY_ALREADY_ACTIVE'
  | 'RECOVERY_CANCELLED';

export class JourneyRecoveryError extends Error {
  readonly code: JourneyErrorCode;
  readonly journeyId?: string;
  readonly cause?: unknown;

  constructor(
    code: JourneyErrorCode,
    message: string,
    journeyId?: string,
    cause?: unknown
  ) {
    super(message);
    this.name = 'JourneyRecoveryError';
    this.code = code;
    this.journeyId = journeyId;
    this.cause = cause;

    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

