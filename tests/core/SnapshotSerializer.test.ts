import { describe, it, expect } from 'vitest';
import { SnapshotSerializer } from '../../src/core/SnapshotSerializer';
import { JourneySnapshot } from '../../src/types/checkpoint';
import { JourneyRecoveryError } from '../../src/utils/errors';

describe('SnapshotSerializer', () => {
  const serializer = new SnapshotSerializer();

  const baseSnapshot: JourneySnapshot<{ name: string; password?: string; token?: string }> = {
    id: 'checkout',
    version: 1,
    createdAt: 1000,
    updatedAt: 2000,
    expiresAt: 5000,
    status: 'active',
    data: {
      name: 'Alice',
      password: 'secret_password',
      token: 'jwt_12345',
    },
  };

  it('serializes and deserializes snapshot preserving structure', () => {
    const raw = serializer.serialize(baseSnapshot);
    expect(typeof raw).toBe('string');

    const restored = serializer.deserialize<typeof baseSnapshot.data>(raw);
    expect(restored.id).toBe(baseSnapshot.id);
    expect(restored.version).toBe(baseSnapshot.version);
    expect(restored.data.name).toBe('Alice');
    expect(restored.checksum).toBeDefined();
  });

  it('excludes sensitive fields when specified', () => {
    const raw = serializer.serialize(baseSnapshot, { exclude: ['password', 'token'] });
    const restored = serializer.deserialize<typeof baseSnapshot.data>(raw);

    expect(restored.data.name).toBe('Alice');
    expect(restored.data.password).toBeUndefined();
    expect(restored.data.token).toBeUndefined();
  });

  it('throws SERIALIZATION_FAILED on circular references', () => {
    const circularData: Record<string, unknown> = { name: 'Circular' };
    circularData.self = circularData;

    const invalidSnapshot: JourneySnapshot<typeof circularData> = {
      ...baseSnapshot,
      data: circularData,
    };

    expect(() => serializer.serialize(invalidSnapshot)).toThrow(JourneyRecoveryError);
    try {
      serializer.serialize(invalidSnapshot);
    } catch (err) {
      expect((err as JourneyRecoveryError).code).toBe('SERIALIZATION_FAILED');
    }
  });

  it('throws SNAPSHOT_CORRUPTED when deserializing invalid JSON', () => {
    expect(() => serializer.deserialize('{ invalid json ')).toThrow(JourneyRecoveryError);
    try {
      serializer.deserialize('{ invalid json ');
    } catch (err) {
      expect((err as JourneyRecoveryError).code).toBe('SNAPSHOT_CORRUPTED');
    }
  });

  it('throws SNAPSHOT_CORRUPTED on empty or non-object payload', () => {
    expect(() => serializer.deserialize('')).toThrow(JourneyRecoveryError);
    expect(() => serializer.deserialize('null')).toThrow(JourneyRecoveryError);
    expect(() => serializer.deserialize('"string"')).toThrow(JourneyRecoveryError);
  });
});
