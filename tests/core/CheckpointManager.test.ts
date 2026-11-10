import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';
import { JourneyRecoveryError } from '../../src/utils/errors';

describe('CheckpointManager', () => {
  let storage: MemoryStorageAdapter;
  let checkpointManager: CheckpointManager;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
    checkpointManager = new CheckpointManager(storage);
  });

  it('saves and retrieves a checkpoint', async () => {
    const data = { step: 1, form: { email: 'test@example.com' } };
    const saved = await checkpointManager.save('checkout', data, {
      version: 1,
      expiry: 10000,
    });

    expect(saved.id).toBe('checkout');
    expect(saved.version).toBe(1);
    expect(saved.data).toEqual(data);
    expect(saved.status).toBe('active');
    expect(saved.expiresAt).toBeDefined();

    const retrieved = await checkpointManager.get<typeof data>('checkout');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.data).toEqual(data);
  });

  it('preserves createdAt across subsequent updates', async () => {
    const first = await checkpointManager.save('checkout', { step: 1 }, { version: 1 });
    const originalCreatedAt = first.createdAt;

    // Small delay
    await new Promise((r) => setTimeout(r, 10));

    const second = await checkpointManager.save('checkout', { step: 2 }, { version: 1 });
    expect(second.createdAt).toBe(originalCreatedAt);
    expect(second.updatedAt).toBeGreaterThanOrEqual(originalCreatedAt);
    expect(second.data).toEqual({ step: 2 });
  });

  it('serializes concurrent writes strictly in order', async () => {
    const sequence: number[] = [];

    // Dispatch 5 concurrent saves
    const promises = [1, 2, 3, 4, 5].map((num) =>
      checkpointManager.save('async-flow', { count: num }, { version: 1 }).then((snap) => {
        sequence.push(snap.data.count);
        return snap;
      })
    );

    await Promise.all(promises);

    expect(sequence).toEqual([1, 2, 3, 4, 5]);

    const finalSnap = await checkpointManager.get<{ count: number }>('async-flow');
    expect(finalSnap?.data.count).toBe(5);
  });

  it('preserves the previous valid checkpoint if a subsequent write fails', async () => {
    // Save first valid checkpoint
    await checkpointManager.save('checkout', { step: 1 }, { version: 1 });

    // Mock storage setItem to fail on next write
    const originalSetItem = storage.setItem.bind(storage);
    let shouldFail = true;
    storage.setItem = vi.fn().mockImplementation(async (key: string, val: string) => {
      if (shouldFail) {
        throw new Error('Disk write error');
      }
      return originalSetItem(key, val);
    });

    // Attempt failing save
    await expect(
      checkpointManager.save('checkout', { step: 2 }, { version: 1 })
    ).rejects.toThrow(JourneyRecoveryError);

    // Verify previous checkpoint is intact
    shouldFail = false;
    const restored = await checkpointManager.get<{ step: number }>('checkout');
    expect(restored?.data.step).toBe(1);
  });

  it('deletes a single journey without affecting others', async () => {
    await checkpointManager.save('journey-A', { a: 1 }, { version: 1 });
    await checkpointManager.save('journey-B', { b: 2 }, { version: 1 });

    await checkpointManager.delete('journey-A');

    expect(await checkpointManager.get('journey-A')).toBeNull();
    expect(await checkpointManager.get('journey-B')).not.toBeNull();
  });

  it('clears all journeys with deleteAll', async () => {
    await checkpointManager.save('journey-1', { a: 1 }, { version: 1 });
    await checkpointManager.save('journey-2', { b: 2 }, { version: 1 });

    await checkpointManager.deleteAll();

    expect(await checkpointManager.get('journey-1')).toBeNull();
    expect(await checkpointManager.get('journey-2')).toBeNull();
  });
});

