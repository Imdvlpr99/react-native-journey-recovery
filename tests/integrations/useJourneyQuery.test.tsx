import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RecoveryProvider } from '../../src/react/RecoveryProvider';
import { useJourneyQuery } from '../../src/integrations/tanstack-query/useJourneyQuery';
import { createTanStackQueryCoordinator } from '../../src/integrations/tanstack-query/QueryRecoveryCoordinator';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { LifecycleManager } from '../../src/core/LifecycleManager';
import { QueryClientLike } from '../../src/integrations/tanstack-query/types';

describe('useJourneyQuery & createTanStackQueryCoordinator', () => {
  let storage: MemoryStorageAdapter;
  let mockQueryClient: QueryClientLike;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
    mockQueryClient = {
      invalidateQueries: vi.fn().mockResolvedValue(undefined),
      refetchQueries: vi.fn().mockResolvedValue(undefined),
      resetQueries: vi.fn().mockResolvedValue(undefined),
    };
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <RecoveryProvider storage={storage}>{children}</RecoveryProvider>
    );
  };

  it('restores snapshot and invalidates/refetches configured queries', async () => {
    const cpManager = new CheckpointManager(storage);
    await cpManager.save(
      'checkout-journey',
      { step: 'payment', cartId: 'cart-999', coupon: 'SAVE20' },
      { version: 1 }
    );

    const onRevalidated = vi.fn();

    const { result } = renderHook(
      () =>
        useJourneyQuery('checkout-journey', {
          queryClient: mockQueryClient,
          invalidateOnRestore: [['cart', 'cart-999'], ['inventory']],
          refetchOnRestore: [['pricing']],
          onRevalidated,
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.available).toBe(true);
    expect(result.current.snapshot?.data).toEqual({
      step: 'payment',
      cartId: 'cart-999',
      coupon: 'SAVE20',
    });

    let restored: any;
    await act(async () => {
      restored = await result.current.restoreAndRevalidate();
    });

    expect(restored.coupon).toBe('SAVE20');
    expect(result.current.data).toEqual({
      step: 'payment',
      cartId: 'cart-999',
      coupon: 'SAVE20',
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['cart', 'cart-999'],
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['inventory'],
    });
    expect(mockQueryClient.refetchQueries).toHaveBeenCalledWith({
      queryKey: ['pricing'],
    });
    expect(onRevalidated).toHaveBeenCalledWith({
      step: 'payment',
      cartId: 'cart-999',
      coupon: 'SAVE20',
    });
  });

  it('discards checkpoint and resets configured query caches', async () => {
    const cpManager = new CheckpointManager(storage);
    await cpManager.save('checkout-journey', { step: 'shipping' }, { version: 1 });

    const { result } = renderHook(
      () =>
        useJourneyQuery('checkout-journey', {
          queryClient: mockQueryClient,
          resetOnClear: [['cart'], ['draft-order']],
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.available).toBe(true);

    await act(async () => {
      await result.current.discardAndReset();
    });

    const stored = await storage.getItem('@rn_journey:checkout-journey');
    expect(stored).toBeNull();

    expect(mockQueryClient.resetQueries).toHaveBeenCalledWith({
      queryKey: ['cart'],
    });
    expect(mockQueryClient.resetQueries).toHaveBeenCalledWith({
      queryKey: ['draft-order'],
    });
  });

  it('coordinates lifecycle events via createTanStackQueryCoordinator', async () => {
    const lifecycle = new LifecycleManager();
    const onRevalidated = vi.fn();

    const unsubscribe = createTanStackQueryCoordinator(lifecycle, {
      journeyId: 'flight-booking',
      queryClient: mockQueryClient,
      invalidateOnRestore: [['flight-seats', 'FL-100']],
      resetOnClear: [['seat-hold']],
      onRevalidated,
    });

    // Simulate recovery restore lifecycle event
    lifecycle.emit({
      journeyId: 'flight-booking',
      status: 'restored',
      timestamp: Date.now(),
      snapshot: {
        id: 'flight-booking',
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'active',
        data: { seat: '14B' },
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['flight-seats', 'FL-100'],
    });
    expect(onRevalidated).toHaveBeenCalledWith({ seat: '14B' });

    // Simulate discard lifecycle event
    lifecycle.emit({
      journeyId: 'flight-booking',
      status: 'discarded',
      timestamp: Date.now(),
    });

    await new Promise((r) => setTimeout(r, 20));

    expect(mockQueryClient.resetQueries).toHaveBeenCalledWith({
      queryKey: ['seat-hold'],
    });

    expect(mockQueryClient.resetQueries).toHaveBeenCalledWith({
      queryKey: ['seat-hold'],
    });

    unsubscribe();
  });
});
