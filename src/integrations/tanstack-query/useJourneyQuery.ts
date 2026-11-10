import { useCallback, useRef } from 'react';
import { useRecovery } from '../../react/useRecovery';
import { QueryCoordinationOptions, UseJourneyQueryHandle } from './types';

/**
 * React hook that coordinates TanStack Query cache invalidation and server revalidation
 * with client-side journey recovery.
 */
export function useJourneyQuery<T = any>(
  journeyId: string,
  options: QueryCoordinationOptions<T>
): UseJourneyQueryHandle<T> {
  const recovery = useRecovery<T>(journeyId);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const revalidate = useCallback(async (): Promise<void> => {
    const { queryClient, invalidateOnRestore, refetchOnRestore } = optionsRef.current;

    if (Array.isArray(invalidateOnRestore)) {
      for (const queryKey of invalidateOnRestore) {
        const filter = Array.isArray(queryKey) ? { queryKey } : queryKey;
        await queryClient.invalidateQueries(filter);
      }
    }

    if (Array.isArray(refetchOnRestore) && typeof queryClient.refetchQueries === 'function') {
      for (const queryKey of refetchOnRestore) {
        const filter = Array.isArray(queryKey) ? { queryKey } : queryKey;
        await queryClient.refetchQueries(filter);
      }
    }
  }, []);

  const restoreAndRevalidate = useCallback(async (): Promise<T> => {
    const restoredData = await recovery.restore();
    await revalidate();

    if (optionsRef.current.onRevalidated) {
      await optionsRef.current.onRevalidated(restoredData);
    }

    return restoredData;
  }, [recovery, revalidate]);

  const discardAndReset = useCallback(async (): Promise<void> => {
    await recovery.discard();

    const { queryClient, resetOnClear } = optionsRef.current;
    if (Array.isArray(resetOnClear) && typeof queryClient.resetQueries === 'function') {
      for (const queryKey of resetOnClear) {
        const filter = Array.isArray(queryKey) ? { queryKey } : queryKey;
        await queryClient.resetQueries(filter);
      }
    }
  }, [recovery]);

  return {
    journeyId,
    status: recovery.status,
    available: recovery.available,
    data: recovery.data,
    snapshot: recovery.snapshot,
    error: recovery.error,
    restoreAndRevalidate,
    discardAndReset,
    revalidate,
  };
}
