import { describe, it, expect } from 'vitest';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { RecoveryManager } from '../../src/core/RecoveryManager';
import { JourneyManager } from '../../src/core/JourneyManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';
import { StorageAdapter } from '../../src/storage/StorageAdapter';
import { JourneyRecoveryError } from '../../src/utils/errors';

describe('Chaos & Extreme Reliability Tests', () => {
  it('handles 50 rapid-fire concurrent writes without state corruption or dropped promises', async () => {
    const storage = new MemoryStorageAdapter();
    const cpManager = new CheckpointManager(storage);
    const journeyManager = new JourneyManager(cpManager);

    journeyManager.registerJourney('stress-test', { version: 1 });

    // Launch 50 concurrent saves in rapid succession
    const promises = Array.from({ length: 50 }, (_, i) =>
      journeyManager.checkpoint('stress-test', {
        counter: i,
        timestamp: Date.now(),
        payload: `data-chunk-${i}`,
      })
    );

    const results = await Promise.all(promises);

    expect(results).toHaveLength(50);
    // Each snapshot should have valid checksum and version
    for (const snap of results) {
      expect(snap.version).toBe(1);
      expect(snap.status).toBe('active');
    }

    // Storage should contain the last written counter
    const finalSnapshot = await cpManager.get<{ counter: number }>('stress-test');
    expect(finalSnapshot).not.toBeNull();
    expect(finalSnapshot!.data.counter).toBe(49);
  });

  it('preserves prior committed checkpoint when storage throws Out-of-Quota error', async () => {
    let writeCount = 0;
    const store = new Map<string, string>();

    // Mock storage that fails after 3 successful writes
    const quotaRestrictedStorage: StorageAdapter = {
      async getItem(key: string) {
        return store.get(key) ?? null;
      },
      async setItem(key: string, value: string) {
        writeCount++;
        if (writeCount > 3) {
          throw new Error('QuotaExceededError: Device disk is full');
        }
        store.set(key, value);
      },
      async removeItem(key: string) {
        store.delete(key);
      },
    };

    const cpManager = new CheckpointManager(quotaRestrictedStorage);
    const recoveryManager = new RecoveryManager(new JourneyManager(cpManager));

    // Save 3 valid checkpoints
    await cpManager.save('quota-journey', { step: 1 });
    await cpManager.save('quota-journey', { step: 2 });
    await cpManager.save('quota-journey', { step: 3, criticalInfo: 'must-not-lose' });

    // 4th save should fail due to quota
    await expect(
      cpManager.save('quota-journey', { step: 4, brokenData: true })
    ).rejects.toThrow('Device disk is full');

    // Prior checkpoint (step 3) must remain intact and recoverable
    const inspection = await recoveryManager.check<{ step: number; criticalInfo: string }>(
      'quota-journey'
    );
    expect(inspection.available).toBe(true);
    expect(inspection.snapshot?.data.step).toBe(3);
    expect(inspection.snapshot?.data.criticalInfo).toBe('must-not-lose');

    const restored = await recoveryManager.restore<{ step: number; criticalInfo: string }>(
      'quota-journey'
    );
    expect(restored.step).toBe(3);
    expect(restored.criticalInfo).toBe('must-not-lose');
  });

  it('safely handles interleaved clear and save calls without deadlocking', async () => {
    const storage = new MemoryStorageAdapter();
    const cpManager = new CheckpointManager(storage);

    // Concurrently fire save -> clear -> save
    const p1 = cpManager.save('race-journey', { status: 'first' });
    const p2 = cpManager.clear('race-journey');
    const p3 = cpManager.save('race-journey', { status: 'final' });

    await Promise.all([p1, p2, p3]);

    const result = await cpManager.get<{ status: string }>('race-journey');
    expect(result).not.toBeNull();
    expect(result!.data.status).toBe('final');
  });

  it('rejects oversized payload exceeding configurable size limit and leaves prior checkpoint unharmed', async () => {
    const storage = new MemoryStorageAdapter();
    // Configure a small 1 KB limit to test boundary enforcement
    const cpManager = new CheckpointManager(storage, {
      maxSizeBytes: 1024,
    });

    // Save valid small checkpoint
    await cpManager.save('size-journey', { step: 1, text: 'small' });

    // Attempt to save massive payload exceeding 1 KB
    const massiveText = 'X'.repeat(2048);
    let thrownError: any = null;
    try {
      await cpManager.save('size-journey', { step: 2, text: massiveText });
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeInstanceOf(JourneyRecoveryError);
    expect((thrownError as JourneyRecoveryError).code).toBe('SERIALIZATION_FAILED');

    // Prior 1st checkpoint must be preserved intact
    const preserved = await cpManager.get<{ step: number; text: string }>('size-journey');
    expect(preserved).not.toBeNull();
    expect(preserved!.data.step).toBe(1);
    expect(preserved!.data.text).toBe('small');
  });

  it('recovers cleanly from simulated transient storage read failure', async () => {
    let failRead = true;
    const store = new Map<string, string>();

    const transientStorage: StorageAdapter = {
      async getItem(key: string) {
        if (failRead) {
          failRead = false; // Next read will succeed
          throw new Error('Transient read timeout');
        }
        return store.get(key) ?? null;
      },
      async setItem(key: string, value: string) {
        store.set(key, value);
      },
      async removeItem(key: string) {
        store.delete(key);
      },
    };

    const cpManager = new CheckpointManager(transientStorage);
    const recoveryManager = new RecoveryManager(new JourneyManager(cpManager));

    await cpManager.save('transient-journey', { safe: true });

    // First inspection fails due to transient read error
    failRead = true;
    const firstCheck = await recoveryManager.check('transient-journey');
    expect(firstCheck.available).toBe(false);
    expect(firstCheck.status).toBe('invalid');

    // Second inspection succeeds without data loss
    const secondCheck = await recoveryManager.check<{ safe: boolean }>('transient-journey');
    expect(secondCheck.available).toBe(true);
    expect(secondCheck.status).toBe('available');
    expect(secondCheck.snapshot?.data.safe).toBe(true);
  });
});
