/**
 * Regression tests for the issues found in the project review.
 * Each test fails on the previous implementation.
 */
import React from 'react';
import { renderHook, act, waitFor, render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  CheckpointManager,
  JourneyManager,
  LifecycleManager,
  RecoveryManager,
  MemoryStorageAdapter,
  RecoveryProvider,
  createTestRecoveryEnvironment,
  useJourney,
  useJourneyForm,
  useRecovery,
  JourneyRecoveryError,
  RecoveryEvent,
  StorageAdapter,
  SnapshotTransform,
} from '../../src';

function engine(storage: StorageAdapter = new MemoryStorageAdapter(), options: { userId?: string; transform?: SnapshotTransform } = {}) {
  const cm = new CheckpointManager(storage, options);
  const jm = new JourneyManager(cm);
  const lm = new LifecycleManager(jm);
  const rm = new RecoveryManager(jm, lm);
  const events: RecoveryEvent[] = [];
  lm.subscribe((e) => events.push(e));
  return { storage, cm, jm, lm, rm, events };
}

const failingStorage = (): StorageAdapter => ({
  getItem: async () => null,
  setItem: async () => {
    throw new Error('disk full');
  },
  removeItem: async () => {},
});

describe('auto-save error handling', () => {
  it('reports debounced failures instead of leaking unhandled rejections', async () => {
    const { jm, events } = engine(failingStorage());
    const h = jm.registerJourney('j', { autoSave: true, debounceMs: 5 });
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);

    await h.checkpoint({ a: 1 });
    await new Promise((r) => setTimeout(r, 40));
    process.off('unhandledRejection', unhandled);

    expect(unhandled).not.toHaveBeenCalled();
    expect(h.status).toBe('failed');
    expect(h.error).toBeInstanceOf(JourneyRecoveryError);
    expect(events.find((e) => e.type === 'save_failed')?.error?.code).toBe('STORAGE_UNAVAILABLE');
  });

  it('flush() rejects when the pending write fails', async () => {
    const { jm } = engine(failingStorage());
    const h = jm.registerJourney('j', { autoSave: true, debounceMs: 10_000 });
    await h.checkpoint({ a: 1 });
    await expect(h.flush()).rejects.toMatchObject({ code: 'STORAGE_UNAVAILABLE' });
  });

  it('calls the provider onError for debounced failures and marks the hook failed', async () => {
    const onError = vi.fn();
    const storage = failingStorage();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RecoveryProvider storage={storage} options={{ autoSave: true, debounceMs: 5 }} onError={onError}>
        {children}
      </RecoveryProvider>
    );
    const { result } = renderHook(() => useJourney('j'), { wrapper });
    await act(async () => {
      await result.current.checkpoint({ a: 1 });
      await new Promise((r) => setTimeout(r, 40));
    });
    expect(onError).toHaveBeenCalledWith(expect.any(JourneyRecoveryError), 'j');
    expect(result.current.status).toBe('failed');
    expect(result.current.error).not.toBeNull();
  });
});

describe('clear and discard with auto-save', () => {
  it('keeps flushing auto-saves made after clear()', async () => {
    const { storage, jm } = engine();
    const h = jm.registerJourney<{ n: number }>('j', { autoSave: true, debounceMs: 10_000 });
    await h.clear();
    await h.checkpoint({ n: 1 });
    await jm.flushPending('j');
    expect(await storage.getItem('@rn_journey:j')).toContain('"n":1');
  });

  it('discard cancels a pending auto-save so the checkpoint is not resurrected', async () => {
    const { storage, jm, rm } = engine();
    const h = jm.registerJourney('j', { autoSave: true, debounceMs: 20 });
    await h.checkpoint({ n: 1 });
    await rm.discard('j');
    await new Promise((r) => setTimeout(r, 50));
    expect(await storage.getItem('@rn_journey:j')).toBeNull();
  });
});

describe('useJourneyForm', () => {
  it('autoRestore loads saved values into the form', async () => {
    const env = createTestRecoveryEnvironment();
    await env.seedCheckpoint('profile', { name: 'Ada' });
    const reset = vi.fn();
    const onRestored = vi.fn();
    const form = { watch: () => () => {}, getValues: () => ({}), reset };
    renderHook(() => useJourneyForm('profile', form, { autoRestore: true, onRestored }), { wrapper: env.wrapper });
    await waitFor(() => expect(reset).toHaveBeenCalledWith({ name: 'Ada' }));
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it('does not resubscribe to watch on every render', async () => {
    const env = createTestRecoveryEnvironment();
    const watch = vi.fn(() => () => {});
    const form = { watch, getValues: () => ({}), reset: vi.fn() };
    const { rerender } = renderHook(() => useJourneyForm('f', form, { exclude: ['ssn'] }), { wrapper: env.wrapper });
    rerender();
    rerender();
    expect(watch).toHaveBeenCalledTimes(1);
  });
});

describe('schema versions', () => {
  it('reports snapshots newer than the app as invalid', async () => {
    const { cm, jm, rm } = engine();
    await cm.save('j', { shape: 'v3' }, { version: 3 });
    jm.registerJourney('j', { version: 2 });
    const result = await rm.check('j');
    expect(result.status).toBe('invalid');
    expect(result.error?.message).toMatch(/newer than the registered version/);
    await expect(rm.restore('j')).rejects.toBeInstanceOf(JourneyRecoveryError);
  });

  it('explains how to fix an unregistered journey with a versioned snapshot', async () => {
    const { cm, rm } = engine();
    await cm.save('j', {}, { version: 2 });
    expect((await rm.check('j')).error?.message).toMatch(/not registered/);
  });

  it('runs validate after migration, not on the old shape', async () => {
    const { cm, jm, rm } = engine();
    await cm.save('j', { address: '12 Main St' }, { version: 1 });
    type V2 = { address: { line1: string } };
    jm.registerJourney<V2>('j', {
      version: 2,
      validate: (d): d is V2 => typeof (d as V2).address === 'object',
      migrate: (old) => ({ address: { line1: (old as { address: string }).address } }),
    });
    expect((await rm.check('j')).status).toBe('available');
    await expect(rm.restore<V2>('j')).resolves.toEqual({ address: { line1: '12 Main St' } });
  });

  it('rejects migrated data that fails validation and leaves storage untouched', async () => {
    const { cm, jm, rm } = engine();
    await cm.save('j', { a: 1 }, { version: 1 });
    jm.registerJourney('j', { version: 2, validate: (_d): _d is never => false, migrate: (d) => d as never });
    await expect(rm.restore('j')).rejects.toMatchObject({ code: 'MIGRATION_FAILED' });
    expect((await cm.get('j'))?.version).toBe(1);
  });

  it('keeps completed status and the original deadline across a migration', async () => {
    const { cm, jm, rm, events } = engine();
    const original = await cm.save('j', { v: 1 }, { version: 1, expiry: 60_000 });
    jm.registerJourney('j', { version: 2, migrate: (d) => d as never });
    await rm.restore('j');
    const migrated = await cm.get('j');
    expect(migrated?.version).toBe(2);
    expect(migrated?.expiresAt).toBe(original.expiresAt);
    expect(events.find((e) => e.type === 'migrated')?.fromVersion).toBe(1);

    await cm.save('done', { v: 1 }, { version: 1 }, { completed: true });
    jm.registerJourney('done', { version: 2, migrate: (d) => d as never });
    await jm.getMigratedSnapshot('done');
    expect((await cm.get('done'))?.status).toBe('completed');
  });

  it('rejects snapshots without a valid version', async () => {
    const storage = new MemoryStorageAdapter();
    const { rm } = engine(storage);
    await storage.setItem('@rn_journey:j', JSON.stringify({ id: 'j', createdAt: 1, updatedAt: 1, status: 'active', data: {} }));
    expect((await rm.check('j')).status).toBe('invalid');
  });
});

describe('key isolation', () => {
  it('a user id containing ":" cannot affect another user', async () => {
    const storage = new MemoryStorageAdapter();
    await engine(storage, { userId: 'a:b' }).cm.save('checkout', { secret: 1 }, { version: 1 });
    await engine(storage, { userId: 'a' }).cm.clearUserJourneys('a');
    expect(await engine(storage, { userId: 'a:b' }).cm.get('checkout')).not.toBeNull();
  });

  it('an unscoped journey id cannot address a user-scoped checkpoint', async () => {
    const storage = new MemoryStorageAdapter();
    await engine(storage, { userId: 'alice' }).cm.save('checkout', { card: 'x' }, { version: 1 });
    expect(await engine(storage).cm.get('u:alice:checkout')).toBeNull();
  });

  it('ordinary ids keep their existing keys', () => {
    expect(engine(undefined, { userId: 'user_42' }).cm.getKey('checkout')).toBe('@rn_journey:u:user_42:checkout');
  });
});

describe('expiry', () => {
  it('expiry 0 expires immediately', async () => {
    const { cm, rm } = engine();
    await cm.save('j', {}, { version: 1, expiry: 0 });
    expect((await rm.check('j')).status).toBe('expired');
  });

  it('absolute expiry is measured from the first save', async () => {
    vi.useFakeTimers({ now: 1_000_000 });
    try {
      const { jm, cm } = engine();
      jm.registerJourney('j', { expiry: 10_000, expiryMode: 'absolute' });
      await jm.checkpoint('j', { n: 1 });
      vi.setSystemTime(1_008_000);
      await jm.checkpoint('j', { n: 2 });
      expect((await cm.get('j'))?.expiresAt).toBe(1_010_000);
    } finally {
      vi.useRealTimers();
    }
  });

  it('sliding expiry (default) restarts on every save', async () => {
    vi.useFakeTimers({ now: 1_000_000 });
    try {
      const { jm, cm } = engine();
      jm.registerJourney('j', { expiry: 10_000 });
      await jm.checkpoint('j', { n: 1 });
      vi.setSystemTime(1_008_000);
      await jm.checkpoint('j', { n: 2 });
      expect((await cm.get('j'))?.expiresAt).toBe(1_018_000);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('validation errors', () => {
  it('wraps a throwing validate() in SNAPSHOT_INVALID with the cause', async () => {
    const { jm } = engine();
    const boom = new Error('boom');
    jm.registerJourney('j', {
      validate: ((): boolean => {
        throw boom;
      }) as never,
    });
    await expect(jm.checkpoint('j', {})).rejects.toMatchObject({ code: 'SNAPSHOT_INVALID', cause: boom });
  });
});

describe('field exclusion', () => {
  it('supports dot paths through objects and arrays', async () => {
    const { cm } = engine();
    const snap = await cm.save(
      'j',
      { payment: { cardNumber: '4242', name: 'Ada' }, cards: [{ cvv: '123', last4: '4242' }], password: 'x' },
      { version: 1 },
      { exclude: ['payment.cardNumber', 'cards.cvv', 'password'] }
    );
    expect(snap.data).toEqual({ payment: { name: 'Ada' }, cards: [{ last4: '4242' }] });
    expect((await cm.get('j'))?.data).toEqual(snap.data);
  });
});

describe('transform hook', () => {
  const reverse: SnapshotTransform = {
    encode: (s) => `enc:${[...s].reverse().join('')}`,
    decode: (s) => {
      if (!s.startsWith('enc:')) throw new Error('bad signature');
      return [...s.slice(4)].reverse().join('');
    },
  };

  it('encodes on write and decodes on read', async () => {
    const storage = new MemoryStorageAdapter();
    const { cm, rm } = engine(storage, { transform: reverse });
    await cm.save('j', { secret: 'abc' }, { version: 1 });
    expect(await storage.getItem('@rn_journey:j')).not.toContain('secret');
    await expect(rm.restore('j')).resolves.toEqual({ secret: 'abc' });
  });

  it('reports values that fail to decode as invalid', async () => {
    const storage = new MemoryStorageAdapter();
    await storage.setItem('@rn_journey:j', 'tampered');
    const { rm } = engine(storage, { transform: reverse });
    const result = await rm.check('j');
    expect(result.status).toBe('invalid');
    expect(result.error?.code).toBe('SNAPSHOT_CORRUPTED');
  });
});

describe('events', () => {
  it('saved events carry metadata only; restored events carry data', async () => {
    const { jm, rm, events } = engine();
    jm.registerJourney('j');
    await jm.checkpoint('j', { secret: 'x' });
    await rm.restore('j');
    const saved = events.find((e) => e.type === 'saved');
    expect(saved?.snapshot).toBeDefined();
    expect(saved?.snapshot && 'data' in saved.snapshot).toBe(false);
    expect(events.find((e) => e.type === 'restored')?.snapshot?.data).toEqual({ secret: 'x' });
  });

  it('emits expired and completed when a check finds them', async () => {
    const { cm, rm, events } = engine();
    await cm.save('old', {}, { version: 1, expiry: 0 });
    await cm.save('done', {}, { version: 1 }, { completed: true });
    await rm.check('old');
    await rm.check('done');
    expect(events.map((e) => e.type)).toEqual(expect.arrayContaining(['expired', 'completed']));
  });

  it('LifecycleManager.onEvent filters by type', async () => {
    const { jm, lm } = engine();
    const onSaved = vi.fn();
    lm.onEvent('saved', onSaved);
    jm.registerJourney('j');
    await jm.checkpoint('j', {});
    await jm.clearJourney('j');
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});

describe('efficiency', () => {
  it('reads the previous snapshot once, not on every save', async () => {
    const storage = new MemoryStorageAdapter();
    const spy = vi.spyOn(storage, 'getItem');
    const { cm } = engine(storage);
    const first = await cm.save('j', { a: 1 }, { version: 1 });
    await cm.save('j', { a: 2 }, { version: 1 });
    const third = await cm.save('j', { a: 3 }, { version: 1 });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(third.createdAt).toBe(first.createdAt);
  });

  it('prunes the per-journey write queue once idle', async () => {
    const { cm } = engine();
    await cm.save('j', {}, { version: 1 });
    await new Promise((r) => setTimeout(r, 0));
    expect((cm as unknown as { queues: Map<string, unknown> }).queues.size).toBe(0);
  });
});

describe('useRecovery', () => {
  it('refresh() re-reads storage', async () => {
    const env = createTestRecoveryEnvironment();
    const { result } = renderHook(() => useRecovery('j'), { wrapper: env.wrapper });
    await waitFor(() => expect(result.current.status).toBe('idle'));
    await env.seedCheckpoint('j', { a: 1 });
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.available).toBe(true);
  });

  it('resets when another component clears the journey', async () => {
    const env = await (async () => {
      const e = createTestRecoveryEnvironment();
      await e.seedCheckpoint('j', { a: 1 });
      return e;
    })();
    const { result } = renderHook(() => ({ recovery: useRecovery('j'), journey: useJourney('j') }), {
      wrapper: env.wrapper,
    });
    await waitFor(() => expect(result.current.recovery.available).toBe(true));
    await act(async () => {
      await result.current.journey.clear();
    });
    expect(result.current.recovery.available).toBe(false);
    expect(result.current.recovery.status).toBe('idle');
  });
});

describe('provider options', () => {
  it('passes maxSizeBytes through to the serializer', async () => {
    const storage = new MemoryStorageAdapter();
    const errors: string[] = [];
    function Probe() {
      const journey = useJourney('big');
      React.useEffect(() => {
        journey.checkpoint({ blob: 'x'.repeat(500) }).catch((e: JourneyRecoveryError) => errors.push(e.code));
      }, []); // eslint-disable-line react-hooks/exhaustive-deps
      return null;
    }
    render(
      <RecoveryProvider storage={storage} options={{ maxSizeBytes: 100 }}>
        <Probe />
      </RecoveryProvider>
    );
    await waitFor(() => expect(errors).toEqual(['SERIALIZATION_FAILED']));
  });
});
