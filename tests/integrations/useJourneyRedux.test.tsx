import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RecoveryProvider } from '../../src/react/RecoveryProvider';
import {
  useJourneyRedux,
  ReduxStoreLike,
} from '../../src/integrations/redux/useJourneyRedux';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';
import { CheckpointManager } from '../../src/core/CheckpointManager';

describe('useJourneyRedux (Slice Integration)', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <RecoveryProvider storage={storage}>{children}</RecoveryProvider>
    );
  };

  it('watches selected Redux slice and checkpoints changes without dumping whole store', async () => {
    let state = {
      globalAuth: { token: 'secret_123' },
      loanApplication: { step: 1, amount: 25000 },
    };

    const listeners = new Set<() => void>();

    const mockStore: ReduxStoreLike<typeof state> = {
      getState: () => state,
      dispatch: vi.fn(),
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };

    renderHook(
      () =>
        useJourneyRedux('loan-flow', mockStore, (s) => s.loanApplication, {
          autoSave: false,
        }),
      { wrapper: createWrapper() }
    );

    // Simulate Redux store update
    await act(async () => {
      state = {
        ...state,
        loanApplication: { step: 2, amount: 35000 },
      };
      listeners.forEach((l) => l());
      await new Promise((r) => setTimeout(r, 10));
    });

    const stored = await storage.getItem('@rn_journey:loan-flow');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);

    // Checkpoint contains ONLY the selected slice
    expect(parsed.data).toEqual({ step: 2, amount: 35000 });
    // Global state is NOT serialized
    expect(parsed.data.globalAuth).toBeUndefined();
  });

  it('restores checkpointed slice by dispatching an action to Redux store', async () => {
    const cpManager = new CheckpointManager(storage);
    await cpManager.save(
      'loan-flow',
      { step: 2, amount: 40000 },
      { version: 1 }
    );

    const mockStore: ReduxStoreLike<any> = {
      getState: () => ({ loanApplication: { step: 1, amount: 0 } }),
      dispatch: vi.fn(),
      subscribe: () => () => {},
    };

    const { result } = renderHook(
      () =>
        useJourneyRedux('loan-flow', mockStore, (s) => s.loanApplication),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.hasSavedProgress).toBe(true);

    const restoreActionCreator = (payload: any) => ({
      type: 'loan/restore',
      payload,
    });

    await act(async () => {
      await result.current.restoreToRedux(restoreActionCreator);
    });

    expect(mockStore.dispatch).toHaveBeenCalledWith({
      type: 'loan/restore',
      payload: { step: 2, amount: 40000 },
    });
  });
});
