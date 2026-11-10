import { describe, it, expect } from 'vitest';
import { SnapshotValidator } from '../../src/core/SnapshotValidator';
import { JourneySnapshot } from '../../src/types/checkpoint';
import { computeChecksum } from '../../src/utils/checksum';

describe('SnapshotValidator', () => {
  const validator = new SnapshotValidator();

  const validSnapshot: JourneySnapshot<{ count: number }> = {
    id: 'counter',
    version: 1,
    createdAt: Date.now() - 5000,
    updatedAt: Date.now() - 1000,
    expiresAt: Date.now() + 60000,
    status: 'active',
    data: { count: 42 },
    checksum: computeChecksum(JSON.stringify({ count: 42 })),
  };

  it('validates a correct snapshot without options', () => {
    const result = validator.validate(validSnapshot);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('detects missing or invalid structural fields', () => {
    expect(validator.validate(null).valid).toBe(false);
    expect(validator.validate({}).valid).toBe(false);
    expect(validator.validate({ ...validSnapshot, id: '' }).valid).toBe(false);
    expect(validator.validate({ ...validSnapshot, version: -1 }).valid).toBe(false);
    expect(validator.validate({ ...validSnapshot, status: 'unknown' }).valid).toBe(false);
    expect(validator.validate({ ...validSnapshot, createdAt: 'not-a-number' }).valid).toBe(false);
  });

  it('detects checksum mismatch indicating corruption', () => {
    const corruptedSnapshot = {
      ...validSnapshot,
      checksum: 'tampered-checksum',
    };
    const result = validator.validate(corruptedSnapshot);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('SNAPSHOT_CORRUPTED');
  });

  it('detects expiry correctly', () => {
    const expiredSnapshot: JourneySnapshot<{ count: number }> = {
      ...validSnapshot,
      expiresAt: Date.now() - 1000, // expired 1s ago
    };

    expect(validator.isExpired(expiredSnapshot)).toBe(true);

    const result = validator.validate(expiredSnapshot);
    expect(result.valid).toBe(false);
    expect(result.isExpired).toBe(true);
    expect(result.error?.code).toBe('JOURNEY_EXPIRED');
  });

  it('executes custom user validate predicate if provided', () => {
    const isPositiveCount = (data: unknown): data is { count: number } => {
      return typeof data === 'object' && data !== null && (data as any).count > 50;
    };

    // validSnapshot count is 42 (< 50)
    const result = validator.validate(validSnapshot, { validate: isPositiveCount });
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('SNAPSHOT_INVALID');

    // With passing custom validation
    const passingSnapshot = {
      ...validSnapshot,
      data: { count: 100 },
      checksum: computeChecksum(JSON.stringify({ count: 100 })),
    };
    const result2 = validator.validate(passingSnapshot, { validate: isPositiveCount });
    expect(result2.valid).toBe(true);
  });
});

