import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RecoveryProvider } from '../../src/react/RecoveryProvider';
import { useRecovery } from '../../src/react/useRecovery';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

describe('useRecovery', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <RecoveryProvider storage={storage}>{children}</RecoveryProvider>
    );
  };

  it('detects available checkpoint and restores it', async () => {
    // Pre-populate storage
    const cpManager = new CheckpointManager(storage);
    await cpManager.save('checkout', { step: 2, item: 'Book' }, { version: 1, expiry: 10000 });

    const { result } = renderHook(
      () => useRecovery<{ step: number; item: string }>('checkout'),
      { wrapper: createWrapper() }
    );

    // Initial check triggers
    await act(async () => {
      // Allow hook effect to run
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.available).toBe(true);
    expect(result.current.status).toBe('available');
    expect(result.current.snapshot?.data).toEqual({ step: 2, item: 'Book' });

    // Restore
    let restoredData: any;
    await act(async () => {
      restoredData = await result.current.restore();
    });

    expect(restoredData).toEqual({ step: 2, item: 'Book' });
    expect(result.current.status).toBe('restored');
    expect(result.current.data).toEqual({ step: 2, item: 'Book' });
  });

  it('discards saved checkpoint properly', async () => {
    const cpManager = new CheckpointManager(storage);
    await cpManager.save('checkout', { step: 1 }, { version: 1 });

    const { result } = renderHook(() => useRecovery('checkout'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.available).toBe(true);

    await act(async () => {
      await result.current.discard();
    });

    expect(result.current.available).toBe(false);
    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
  });
});

