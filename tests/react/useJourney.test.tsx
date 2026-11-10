import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RecoveryProvider } from '../../src/react/RecoveryProvider';
import { useJourney } from '../../src/react/useJourney';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

describe('useJourney', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <RecoveryProvider storage={storage}>{children}</RecoveryProvider>
    );
  };

  it('saves checkpoints and clears them via hook handle', async () => {
    const { result } = renderHook(
      () => useJourney<{ step: number }>('checkout', { version: 1 }),
      { wrapper: createWrapper() }
    );

    expect(result.current.id).toBe('checkout');

    await act(async () => {
      await result.current.checkpoint({ step: 1 });
    });

    // Check stored value
    const stored = await storage.getItem('@rn_journey:checkout');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).data).toEqual({ step: 1 });

    // Clear
    await act(async () => {
      await result.current.clear();
    });

    expect(await storage.getItem('@rn_journey:checkout')).toBeNull();
  });
});

