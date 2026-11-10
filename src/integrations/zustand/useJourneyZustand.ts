import { useEffect, useCallback, useRef } from 'react';
import { useJourney } from '../../react/useJourney';
import { useRecovery } from '../../react/useRecovery';
import { RecoveryStatus } from '../../types/recovery';
import { JourneySnapshot } from '../../types/checkpoint';

export interface ZustandStoreLike<TState> {
  getState: () => TState;
  setState: (partial: Partial<TState> | ((state: TState) => Partial<TState>)) => void;
  subscribe: (listener: (state: TState, prevState: TState) => void) => () => void;
}

export interface UseJourneyZustandOptions<TSlice> {
  autoSave?: boolean;
  debounceMs?: number;
  exclude?: string[];
  autoRestore?: boolean;
  onRestored?: (slice: TSlice) => void;
}

export interface JourneyZustandHandle<TSlice> {
  journeyId: string;
  hasSavedProgress: boolean;
  status: RecoveryStatus;
  restoreToStore: (updater: (slice: TSlice) => any) => Promise<TSlice>;
  clearStore: () => Promise<void>;
  checkpointStore: () => Promise<JourneySnapshot<TSlice>>;
}

/**
 * Connects a specific Zustand store slice to a journey recovery lifecycle.
 * In accordance with product principles, captures only the selected slice,
 * never serializing entire global state trees automatically.
 */
export function useJourneyZustand<TState, TSlice>(
  journeyId: string,
  store: ZustandStoreLike<TState>,
  selector: (state: TState) => TSlice,
  options?: UseJourneyZustandOptions<TSlice>
): JourneyZustandHandle<TSlice> {
  const journey = useJourney<TSlice>(journeyId, {
    autoSave: options?.autoSave ?? true,
    debounceMs: options?.debounceMs ?? 500,
  });

  const recovery = useRecovery<TSlice>(journeyId);

  const storeRef = useRef(store);
  storeRef.current = store;

  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const onRestoredRef = useRef(options?.onRestored);
  onRestoredRef.current = options?.onRestored;

  // Auto-restore slice if configured
  useEffect(() => {
    if (options?.autoRestore && recovery.available && recovery.data) {
      onRestoredRef.current?.(recovery.data);
    }
  }, [options?.autoRestore, recovery.available, recovery.data]);

  // Subscribe to store updates and checkpoint only when the selected slice changes
  useEffect(() => {
    let lastSliceJson = '';
    try {
      lastSliceJson = JSON.stringify(selectorRef.current(store.getState()));
    } catch {
      // Ignore initial circular/stringifying errors
    }

    const unsubscribe = store.subscribe((nextState) => {
      try {
        const nextSlice = selectorRef.current(nextState);
        const currentSliceJson = JSON.stringify(nextSlice);
        if (currentSliceJson !== lastSliceJson) {
          lastSliceJson = currentSliceJson;
          journey.checkpoint(nextSlice, {
            exclude: options?.exclude,
          });
        }
      } catch {
        // Safe fallback
      }
    });

    return () => {
      unsubscribe();
    };
  }, [store, journey, options?.exclude]);

  const restoreToStore = useCallback(
    async (updater: (slice: TSlice) => any): Promise<TSlice> => {
      const restored = await recovery.restore();
      const partial = updater(restored);
      storeRef.current.setState(partial);
      onRestoredRef.current?.(restored);
      return restored;
    },
    [recovery]
  );

  const clearStore = useCallback(async (): Promise<void> => {
    await journey.clear();
  }, [journey]);

  const checkpointStore = useCallback(async (): Promise<JourneySnapshot<TSlice>> => {
    const slice = selectorRef.current(storeRef.current.getState());
    return journey.checkpoint(slice, {
      exclude: options?.exclude,
    });
  }, [journey, options?.exclude]);

  return {
    journeyId,
    hasSavedProgress: recovery.available,
    status: recovery.status,
    restoreToStore,
    clearStore,
    checkpointStore,
  };
}
