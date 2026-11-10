import { RecoveryStatus } from '../../types/recovery';
import { JourneySnapshot } from '../../types/checkpoint';

export interface QueryClientLike {
  invalidateQueries: (filters?: any, options?: any) => Promise<void> | void;
  refetchQueries?: (filters?: any, options?: any) => Promise<void> | void;
  resetQueries?: (filters?: any, options?: any) => Promise<void> | void;
}

export interface QueryCoordinationOptions<T = any> {
  queryClient: QueryClientLike;
  /**
   * Query keys or filter descriptors to invalidate when the journey checkpoint is restored.
   * e.g. [['cart'], ['inventory', itemId]]
   */
  invalidateOnRestore?: any[];
  /**
   * Query keys or filter descriptors to refetch when the journey checkpoint is restored.
   */
  refetchOnRestore?: any[];
  /**
   * Query keys or filter descriptors to reset when the journey checkpoint is discarded.
   */
  resetOnClear?: any[];
  /**
   * Optional callback triggered after cache invalidation/refetching completes.
   */
  onRevalidated?: (data: T) => void | Promise<void>;
}

export interface UseJourneyQueryHandle<T> {
  journeyId: string;
  status: RecoveryStatus;
  available: boolean;
  data: T | null;
  snapshot: JourneySnapshot<T> | null;
  error: Error | null;
  restoreAndRevalidate: () => Promise<T>;
  discardAndReset: () => Promise<void>;
  revalidate: () => Promise<void>;
}
