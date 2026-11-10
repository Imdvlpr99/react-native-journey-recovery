import { LifecycleManager } from '../../core/LifecycleManager';
import { QueryClientLike, QueryCoordinationOptions } from './types';

export interface CoordinatorConfig<T = any> extends QueryCoordinationOptions<T> {
  journeyId: string;
}

/**
 * Creates an event-driven coordinator that synchronizes TanStack Query cache invalidations
 * and resets with journey recovery lifecycle events.
 */
export function createTanStackQueryCoordinator<T = any>(
  lifecycleManager: LifecycleManager,
  config: CoordinatorConfig<T>
): () => void {
  const { journeyId, queryClient, invalidateOnRestore, refetchOnRestore, resetOnClear, onRevalidated } =
    config;

  const unsubRestore = lifecycleManager.on('restored', async (event) => {
    if (event.journeyId !== journeyId) return;

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

    if (onRevalidated) {
      await onRevalidated(event.snapshot?.data ?? (event as any).data);
    }
  });

  const unsubDiscard = lifecycleManager.on('discarded', async (event) => {
    if (event.journeyId !== journeyId) return;

    if (Array.isArray(resetOnClear) && typeof queryClient.resetQueries === 'function') {
      for (const queryKey of resetOnClear) {
        const filter = Array.isArray(queryKey) ? { queryKey } : queryKey;
        await queryClient.resetQueries(filter);
      }
    }
  });

  return () => {
    unsubRestore();
    unsubDiscard();
  };
}
