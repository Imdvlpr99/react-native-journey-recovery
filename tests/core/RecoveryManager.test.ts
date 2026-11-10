import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecoveryManager } from '../../src/core/RecoveryManager';
import { JourneyManager } from '../../src/core/JourneyManager';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { LifecycleManager } from '../../src/core/LifecycleManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';
import { JourneyRecoveryError } from '../../src/utils/errors';

describe('RecoveryManager', () => {
  let storage: MemoryStorageAdapter;
  let checkpointManager: CheckpointManager;
  let journeyManager: JourneyManager;
  let lifecycleManager: LifecycleManager;
  let recoveryManager: RecoveryManager;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
    checkpointManager = new CheckpointManager(storage);
    journeyManager = new JourneyManager(checkpointManager);
    lifecycleManager = new LifecycleManager(journeyManager);
    recoveryManager = new RecoveryManager(journeyManager, lifecycleManager);
  });

  it('reports idle when no checkpoint exists', async () => {
    const result = await recoveryManager.check('checkout');
    expect(result.available).toBe(false);
    expect(result.status).toBe('idle');
    expect(result.snapshot).toBeNull();
  });

  it('reports available for valid, unexpired checkpoints', async () => {
    await checkpointManager.save('checkout', { step: 2 }, { version: 1, expiry: 10000 });

    const result = await recoveryManager.check<{ step: number }>('checkout');
    expect(result.available).toBe(true);
    expect(result.status).toBe('available');
    expect(result.snapshot?.data.step).toBe(2);
  });

  it('reports expired for checkpoints past expiry timestamp', async () => {
    // Save checkpoint expired in past
    await checkpointManager.save('checkout', { step: 1 }, { version: 1, expiry: -1000 });

    const result = await recoveryManager.check('checkout');
    expect(result.available).toBe(false);
    expect(result.status).toBe('expired');
    expect(result.error?.code).toBe('JOURNEY_EXPIRED');
  });

  it('restores valid checkpoint and notifies lifecycle listeners', async () => {
    await checkpointManager.save('checkout', { step: 3 }, { version: 1, expiry: 10000 });

    const listener = vi.fn();
    lifecycleManager.subscribe(listener);

    const restoredData = await recoveryManager.restore<{ step: number }>('checkout');
    expect(restoredData.step).toBe(3);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        journeyId: 'checkout',
        status: 'restored',
      })
    );
  });

  it('throws when attempting to restore expired checkpoint', async () => {
    await checkpointManager.save('checkout', { step: 1 }, { version: 1, expiry: -1000 });

    await expect(recoveryManager.restore('checkout')).rejects.toThrow(JourneyRecoveryError);
    try {
      await recoveryManager.restore('checkout');
    } catch (err) {
      expect((err as JourneyRecoveryError).code).toBe('JOURNEY_EXPIRED');
    }
  });

  it('discards checkpoint and emits event', async () => {
    await checkpointManager.save('checkout', { step: 1 }, { version: 1 });

    const listener = vi.fn();
    lifecycleManager.subscribe(listener);

    await recoveryManager.discard('checkout');

    expect(await checkpointManager.get('checkout')).toBeNull();
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        journeyId: 'checkout',
        status: 'idle',
      })
    );
  });
});

