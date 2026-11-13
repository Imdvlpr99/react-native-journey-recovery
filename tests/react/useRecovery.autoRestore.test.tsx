import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RecoveryProvider } from '../../src/react/RecoveryProvider';
import { useRecovery } from '../../src/react/useRecovery';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

describe('useRecovery — autoRestore', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  const createWrapper = () =>
    ({ children }: { children: React.ReactNode }) => (
      <RecoveryProvider storage={storage}>{children}</RecoveryProvider>
    );

  it('automatically restores data on mount when autoRestore:true and snapshot exists', async () => {
    const cm = new CheckpointManager(storage);
    await cm.save('auto-journey', { name: 'Alice', step: 3 }, { version: 1, expiry: 60_000 });

    const { result } = renderHook(
      () => useRecovery<{ name: string; step: number }>('auto-journey', { autoRestore: true }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });

    expect(result.current.status).toBe('restored');
    expect(result.current.data).toEqual({ name: 'Alice', step: 3 });
    expect(result.current.available).toBe(true);
  });

  it('does not auto-restore when autoRestore is not set', async () => {
    const cm = new CheckpointManager(storage);
    await cm.save('no-auto', { step: 1 }, { version: 1, expiry: 60_000 });

    const { result } = renderHook(
      () => useRecovery('no-auto'),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });

    expect(result.current.status).toBe('available');
    expect(result.current.data).toBeNull(); // not yet restored
  });

  it('stays idle when autoRestore:true but no snapshot', async () => {
    const { result } = renderHook(
      () => useRecovery('ghost', { autoRestore: true }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
  });

  it('restore() transitions through restoring → restored', async () => {
    const cm = new CheckpointManager(storage);
    await cm.save('manual-restore', { amount: 99 }, { version: 1, expiry: 60_000 });

    const { result } = renderHook(
      () => useRecovery<{ amount: number }>('manual-restore'),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });

    expect(result.current.available).toBe(true);

    let restored: any;
    await act(async () => {
      restored = await result.current.restore();
    });

    expect(restored).toEqual({ amount: 99 });
    expect(result.current.status).toBe('restored');
    expect(result.current.data).toEqual({ amount: 99 });
  });

  it('discard() resets all state to idle', async () => {
    const cm = new CheckpointManager(storage);
    await cm.save('discard-me', { x: 1 }, { version: 1, expiry: 60_000 });

    const { result } = renderHook(
      () => useRecovery('discard-me'),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });

    await act(async () => {
      await result.current.discard();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.available).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.snapshot).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
