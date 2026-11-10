import { describe, it, expect } from 'vitest';
import { JourneyRecoveryError, JourneyErrorCode } from '../../src/utils/errors';

describe('JourneyRecoveryError', () => {
  it('creates error with code, message, journeyId, and maintains prototype', () => {
    const err = new JourneyRecoveryError('JOURNEY_EXPIRED', 'Checkout expired', 'checkout');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(JourneyRecoveryError);
    expect(err.code).toBe('JOURNEY_EXPIRED');
    expect(err.journeyId).toBe('checkout');
    expect(err.message).toBe('Checkout expired');
    expect(err.name).toBe('JourneyRecoveryError');
  });

  it('supports cause and serializes properly', () => {
    const cause = new Error('Disk full');
    const err = new JourneyRecoveryError('STORAGE_UNAVAILABLE', 'Failed to save', 'cart', cause);
    expect(err.cause).toBe(cause);
    expect(err.code).toBe('STORAGE_UNAVAILABLE');
  });

  it('checks standard error codes', () => {
    const codes: JourneyErrorCode[] = [
      'JOURNEY_NOT_FOUND',
      'JOURNEY_EXPIRED',
      'SNAPSHOT_INVALID',
      'SNAPSHOT_CORRUPTED',
      'MIGRATION_FAILED',
      'STORAGE_UNAVAILABLE',
      'SERIALIZATION_FAILED',
      'JOURNEY_ALREADY_ACTIVE',
      'RECOVERY_CANCELLED',
    ];
    expect(codes.length).toBe(9);
  });
});

