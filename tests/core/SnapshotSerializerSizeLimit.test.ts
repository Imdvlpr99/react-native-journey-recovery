import { describe, it, expect } from 'vitest';
import { SnapshotSerializer } from '../../src/core/SnapshotSerializer';
import { JourneySnapshot } from '../../src/types/checkpoint';
import { JourneyRecoveryError } from '../../src/utils/errors';

describe('SnapshotSerializer Size Limits & Storage Version', () => {
  it('enforces maximum snapshot byte size limits', () => {
    // 100 bytes max limit
    const serializer = new SnapshotSerializer({ maxSizeBytes: 100 });

    const largeData = { text: 'A'.repeat(200) };
    const snapshot: JourneySnapshot<typeof largeData> = {
      id: 'large-flow',
      version: 1,
      createdAt: 1000,
      updatedAt: 1000,
      status: 'active',
      data: largeData,
    };

    expect(() => serializer.serialize(snapshot)).toThrow(JourneyRecoveryError);
    try {
      serializer.serialize(snapshot);
    } catch (err) {
      expect((err as JourneyRecoveryError).code).toBe('SERIALIZATION_FAILED');
      expect((err as JourneyRecoveryError).message).toContain('exceeds maximum allowed limit');
    }
  });

  it('includes storage format version metadata in serialized output', () => {
    const serializer = new SnapshotSerializer();
    const snapshot: JourneySnapshot<{ count: number }> = {
      id: 'versioned',
      version: 1,
      createdAt: 1000,
      updatedAt: 1000,
      status: 'active',
      data: { count: 5 },
    };

    const raw = serializer.serialize(snapshot);
    const parsed = JSON.parse(raw);

    // Format version exists on stored envelope
    expect(parsed._formatVersion).toBe(1);

    const deserialized = serializer.deserialize<{ count: number }>(raw);
    expect(deserialized.data.count).toBe(5);
  });
});

