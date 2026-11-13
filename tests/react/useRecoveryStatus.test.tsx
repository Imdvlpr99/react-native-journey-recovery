import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RecoveryProvider } from '../../src/react/RecoveryProvider';
import { useRecoveryStatus } from '../../src/react/useRecoveryStatus';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

describe('useRecoveryStatus', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  const createWrapper = () =>
    ({ children }: { children: React.ReactNode }) => (
      <RecoveryProvider storage={storage}>{children}</RecoveryProvider>
    );

  it('returns "checking" initially then "idle" when no checkpoint exists', async () => {
    const { result } = renderHook(() => useRecoveryStatus('no-journey'), {
      wrapper: createWrapper(),
    });

    // Initial state is 'checking'
    expect(result.current).toBe('checking');

    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });

    expect(result.current).toBe('idle');
  });

  it('returns "available" when a valid checkpoint exists', async () => {
    const cm = new CheckpointManager(storage);
    await cm.save('status-journey', { step: 2 }, { version: 1, expiry: 60_000 });

    const { result } = renderHook(() => useRecoveryStatus('status-journey'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });

    expect(result.current).toBe('available');
  });

  it('returns "expired" when checkpoint is past its TTL', async () => {
    const cm = new CheckpointManager(storage);
    await cm.save('exp-journey', { step: 1 }, { version: 1 }, { expiry: -1000 });

    const { result } = renderHook(() => useRecoveryStatus('exp-journey'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });

    expect(result.current).toBe('expired');
  });
});
