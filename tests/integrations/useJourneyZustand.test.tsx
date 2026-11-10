import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RecoveryProvider } from '../../src/react/RecoveryProvider';
import {
  useJourneyZustand,
  ZustandStoreLike,
} from '../../src/integrations/zustand/useJourneyZustand';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';
import { CheckpointManager } from '../../src/core/CheckpointManager';

describe('useJourneyZustand (Slice Integration)', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <RecoveryProvider storage={storage}>{children}</RecoveryProvider>
    );
  };

  it('watches selected store slice and checkpoints changes without dumping whole store', async () => {
    let state = {
      unrelatedGlobalData: 'sensitive-token-123',
      checkoutSlice: { step: 1, items: ['Phone'] },
    };

    const listeners = new Set<(s: typeof state, prev: typeof state) => void>();

    const mockStore: ZustandStoreLike<typeof state> = {
      getState: () => state,
      setState: (partial) => {
        const next = typeof partial === 'function' ? partial(state) : partial;
        const prev = state;
        state = { ...state, ...next };
        listeners.forEach((l) => l(state, prev));
      },
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };

    renderHook(
      () =>
        useJourneyZustand('checkout-slice', mockStore, (s) => s.checkoutSlice, {
          autoSave: false,
        }),
      { wrapper: createWrapper() }
    );

    // Update store state
    await act(async () => {
      mockStore.setState({
        checkoutSlice: { step: 2, items: ['Phone', 'Charger'] },
      });
      await new Promise((r) => setTimeout(r, 10));
    });

    const stored = await storage.getItem('@rn_journey:checkout-slice');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);

    // Checkpoint contains ONLY the selected slice
    expect(parsed.data).toEqual({ step: 2, items: ['Phone', 'Charger'] });
    // Global state is NOT serialized!
    expect(parsed.data.unrelatedGlobalData).toBeUndefined();
  });

  it('restores checkpointed slice into store using restoreToStore', async () => {
    const cpManager = new CheckpointManager(storage);
    await cpManager.save(
      'checkout-slice',
      { step: 3, items: ['Laptop'] },
      { version: 1 }
    );

    let state = {
      checkoutSlice: { step: 1, items: [] },
    };

    const mockStore: ZustandStoreLike<typeof state> = {
      getState: () => state,
      setState: vi.fn((partial) => {
        state = { ...state, ...partial };
      }),
      subscribe: () => () => {},
    };

    const { result } = renderHook(
      () =>
        useJourneyZustand('checkout-slice', mockStore, (s) => s.checkoutSlice),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.hasSavedProgress).toBe(true);

    await act(async () => {
      await result.current.restoreToStore((restoredSlice) => ({
        checkoutSlice: restoredSlice,
      }));
    });

    expect(mockStore.setState).toHaveBeenCalledWith({
      checkoutSlice: { step: 3, items: ['Laptop'] },
    });
  });
});
