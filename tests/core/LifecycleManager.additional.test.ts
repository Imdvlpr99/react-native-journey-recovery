import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LifecycleManager } from '../../src/core/LifecycleManager';
import { JourneyManager } from '../../src/core/JourneyManager';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

describe('LifecycleManager — additional coverage', () => {
  let lifecycleManager: LifecycleManager;

  beforeEach(() => {
    const storage = new MemoryStorageAdapter();
    const cm = new CheckpointManager(storage);
    const jm = new JourneyManager(cm);
    lifecycleManager = new LifecycleManager(jm);
  });

  // --- on() filtered subscriptions ---

  it('on("restored") receives only restored events', () => {
    const listener = vi.fn();
    lifecycleManager.on('restored', listener);

    lifecycleManager.emit({ journeyId: 'j1', status: 'restored', timestamp: 1 });
    lifecycleManager.emit({ journeyId: 'j2', status: 'idle', timestamp: 2 });
    lifecycleManager.emit({ journeyId: 'j3', status: 'failed', timestamp: 3 });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ journeyId: 'j1', status: 'restored' })
    );
  });

  it('on("all") receives every event regardless of status', () => {
    const listener = vi.fn();
    lifecycleManager.on('all', listener);

    lifecycleManager.emit({ journeyId: 'a', status: 'restored', timestamp: 1 });
    lifecycleManager.emit({ journeyId: 'b', status: 'idle', timestamp: 2 });
    lifecycleManager.emit({ journeyId: 'c', status: 'active', timestamp: 3 });

    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('on() unsubscribe callback stops filtered delivery', () => {
    const listener = vi.fn();
    const off = lifecycleManager.on('available', listener);

    lifecycleManager.emit({ journeyId: 'x', status: 'available', timestamp: 1 });
    expect(listener).toHaveBeenCalledOnce();

    off();
    lifecycleManager.emit({ journeyId: 'x', status: 'available', timestamp: 2 });
    expect(listener).toHaveBeenCalledOnce(); // still 1
  });

  it('on("idle") does NOT receive non-idle events', () => {
    const listener = vi.fn();
    lifecycleManager.on('idle', listener);

    lifecycleManager.emit({ journeyId: 'j', status: 'restored', timestamp: 1 });
    lifecycleManager.emit({ journeyId: 'j', status: 'available', timestamp: 2 });
    lifecycleManager.emit({ journeyId: 'j', status: 'failed', timestamp: 3 });

    expect(listener).not.toHaveBeenCalled();
  });

  // --- emit() subscriber error isolation ---

  it('emit() does not propagate errors thrown by a faulty subscriber', () => {
    const faultyListener = vi.fn(() => {
      throw new Error('subscriber blew up');
    });
    const goodListener = vi.fn();

    lifecycleManager.subscribe(faultyListener);
    lifecycleManager.subscribe(goodListener);

    // Should not throw
    expect(() =>
      lifecycleManager.emit({ journeyId: 'j', status: 'restored', timestamp: 1 })
    ).not.toThrow();

    // Good listener still received the event
    expect(goodListener).toHaveBeenCalledOnce();
  });

  it('emit() continues delivering to remaining subscribers after one throws', () => {
    const order: string[] = [];

    lifecycleManager.subscribe(() => {
      order.push('first');
      throw new Error('first throws');
    });
    lifecycleManager.subscribe(() => order.push('second'));
    lifecycleManager.subscribe(() => order.push('third'));

    lifecycleManager.emit({ journeyId: 'j', status: 'idle', timestamp: 1 });

    expect(order).toEqual(['first', 'second', 'third']);
  });

  // --- flush without journeyManager ---

  it('flush() with no journeyManager does not throw', async () => {
    const standalone = new LifecycleManager();
    await expect(standalone.flush()).resolves.not.toThrow();
  });
});
