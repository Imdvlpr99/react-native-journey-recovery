import { JourneySnapshot } from '../types/checkpoint';
import { JourneyOptions } from '../types/journey';
import { JourneyRecoveryError } from '../utils/errors';
import { computeChecksum } from '../utils/checksum';

export interface ValidationResult<T> {
  valid: boolean;
  isExpired?: boolean;
  snapshot?: JourneySnapshot<T>;
  error?: JourneyRecoveryError;
}

export class SnapshotValidator {
  /**
   * Checks whether a snapshot has passed its expiration timestamp.
   */
  isExpired(snapshot: JourneySnapshot<unknown>): boolean {
    if (typeof snapshot.expiresAt === 'number') {
      return Date.now() >= snapshot.expiresAt;
    }
    return false;
  }

  /**
   * Validates structural integrity, checksum, expiry, and custom validation predicates.
   */
  validate<T>(
    candidate: unknown,
    options?: Pick<JourneyOptions<T>, 'validate'>
  ): ValidationResult<T> {
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
      return {
        valid: false,
        error: new JourneyRecoveryError(
          'SNAPSHOT_CORRUPTED',
          'Candidate snapshot is not a valid object'
        ),
      };
    }

    const s = candidate as Partial<JourneySnapshot<T>>;

    if (typeof s.id !== 'string' || s.id.trim().length === 0) {
      return {
        valid: false,
        error: new JourneyRecoveryError(
          'SNAPSHOT_INVALID',
          'Snapshot must have a non-empty string id',
          s.id
        ),
      };
    }

    if (typeof s.version !== 'number' || !Number.isInteger(s.version) || s.version < 0) {
      return {
        valid: false,
        error: new JourneyRecoveryError(
          'SNAPSHOT_INVALID',
          'Snapshot must have a non-negative integer version',
          s.id
        ),
      };
    }

    if (typeof s.createdAt !== 'number' || isNaN(s.createdAt) || s.createdAt <= 0) {
      return {
        valid: false,
        error: new JourneyRecoveryError(
          'SNAPSHOT_INVALID',
          'Snapshot createdAt must be a valid positive timestamp',
          s.id
        ),
      };
    }

    if (typeof s.updatedAt !== 'number' || isNaN(s.updatedAt) || s.updatedAt <= 0) {
      return {
        valid: false,
        error: new JourneyRecoveryError(
          'SNAPSHOT_INVALID',
          'Snapshot updatedAt must be a valid positive timestamp',
          s.id
        ),
      };
    }

    if (typeof s.version !== 'number' || !Number.isInteger(s.version) || s.version < 1) {
      return {
        valid: false,
        error: new JourneyRecoveryError(
          'SNAPSHOT_INVALID',
          'Snapshot version must be a positive integer',
          s.id
        ),
      };
    }
    if (s.status !== 'active' && s.status !== 'completed') {
      return {
        valid: false,
        error: new JourneyRecoveryError(
          'SNAPSHOT_INVALID',
          `Snapshot status must be "active" or "completed", got "${String(s.status)}"`,
          s.id
        ),
      };
    }

    if (s.data === undefined) {
      return {
        valid: false,
        error: new JourneyRecoveryError(
          'SNAPSHOT_INVALID',
          'Snapshot data payload is missing',
          s.id
        ),
      };
    }

    // Check integrity checksum if present
    if (s.checksum) {
      try {
        const expectedChecksum = computeChecksum(JSON.stringify(s.data));
        if (s.checksum !== expectedChecksum) {
          return {
            valid: false,
            error: new JourneyRecoveryError(
              'SNAPSHOT_CORRUPTED',
              'Snapshot data checksum mismatch, payload may have been tampered or corrupted',
              s.id
            ),
          };
        }
      } catch {
        return {
          valid: false,
          error: new JourneyRecoveryError(
            'SNAPSHOT_CORRUPTED',
            'Failed to compute checksum for data payload',
            s.id
          ),
        };
      }
    }

    // Expiry check
    const completeSnapshot = s as JourneySnapshot<T>;
    if (this.isExpired(completeSnapshot)) {
      return {
        valid: false,
        isExpired: true,
        snapshot: completeSnapshot,
        error: new JourneyRecoveryError(
          'JOURNEY_EXPIRED',
          `Journey "${completeSnapshot.id}" has expired`,
          completeSnapshot.id
        ),
      };
    }

    // User-supplied validation rule
    if (options?.validate) {
      try {
        const isValid = options.validate(completeSnapshot.data);
        if (!isValid) {
          return {
            valid: false,
            snapshot: completeSnapshot,
            error: new JourneyRecoveryError(
              'SNAPSHOT_INVALID',
              `Data payload for journey "${completeSnapshot.id}" failed custom validation`,
              completeSnapshot.id
            ),
          };
        }
      } catch (err) {
        return {
          valid: false,
          snapshot: completeSnapshot,
          error: new JourneyRecoveryError(
            'SNAPSHOT_INVALID',
            `Custom validation error: ${err instanceof Error ? err.message : String(err)}`,
            completeSnapshot.id,
            err
          ),
        };
      }
    }

    return {
      valid: true,
      snapshot: completeSnapshot,
    };
  }
}

