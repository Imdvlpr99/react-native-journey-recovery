import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LifecycleManager } from '../../src/core/LifecycleManager';
import { JourneyManager } from '../../src/core/JourneyManager';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

describe('LifecycleManager', () => {
  let storage: MemoryStorageAdapter;
  let checkpointManager: CheckpointManager;
  let journeyManager: JourneyManager;
  let lifecycleManager: LifecycleManager;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
    checkpointManager = new CheckpointManager(storage);
    journeyManager = new JourneyManager(checkpointManager);
    lifecycleManager = new LifecycleManager(journeyManager);
  });

  it('subscribes and receives lifecycle events, and unsubscribes cleanly', () => {
    const listener = vi.fn();
    const unsubscribe = lifecycleManager.subscribe(listener);

    lifecycleManager.emit({
      journeyId: 'checkout',
      status: 'restored',
      timestamp: Date.now(),
    });

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();

    lifecycleManager.emit({
      journeyId: 'checkout',
      status: 'idle',
      timestamp: Date.now(),
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('flushes pending auto-save writes across registered journeys', () => {
    const flushSpy = vi.spyOn(journeyManager, 'flushPending');
    lifecycleManager.flush();
    expect(flushSpy).toHaveBeenCalled();
  });
});

