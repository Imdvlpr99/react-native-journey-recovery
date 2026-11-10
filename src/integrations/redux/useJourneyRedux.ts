import { useEffect, useCallback, useRef } from 'react';
import { useJourney } from '../../react/useJourney';
import { useRecovery } from '../../react/useRecovery';
import { RecoveryStatus } from '../../types/recovery';
import { JourneySnapshot } from '../../types/checkpoint';

export interface ReduxStoreLike<TState> {
  getState: () => TState;
  dispatch: (action: any) => any;
  subscribe: (listener: () => void) => () => void;
}

export interface UseJourneyReduxOptions<TSlice> {
  autoSave?: boolean;
  debounceMs?: number;
  exclude?: string[];
  autoRestore?: boolean;
  onRestored?: (slice: TSlice) => void;
}

export interface JourneyReduxHandle<TSlice> {
  journeyId: string;
  hasSavedProgress: boolean;
  status: RecoveryStatus;
  restoreToRedux: (actionCreator: (slice: TSlice) => any) => Promise<TSlice>;
  clearReduxJourney: () => Promise<void>;
  checkpointRedux: () => Promise<JourneySnapshot<TSlice>>;
}

/**
 * Connects a specific Redux store slice to a journey recovery lifecycle.
 * In accordance with product principles, captures only the selected slice,
 * never serializing entire global Redux state trees automatically.
 */
export function useJourneyRedux<TState, TSlice>(
  journeyId: string,
  store: ReduxStoreLike<TState>,
  selector: (state: TState) => TSlice,
  options?: UseJourneyReduxOptions<TSlice>
): JourneyReduxHandle<TSlice> {
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
      // Ignore initial stringifying errors
    }

    const unsubscribe = store.subscribe(() => {
      try {
        const nextSlice = selectorRef.current(storeRef.current.getState());
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

  const restoreToRedux = useCallback(
    async (actionCreator: (slice: TSlice) => any): Promise<TSlice> => {
      const restored = await recovery.restore();
      const action = actionCreator(restored);
      storeRef.current.dispatch(action);
      onRestoredRef.current?.(restored);
      return restored;
    },
    [recovery]
  );

  const clearReduxJourney = useCallback(async (): Promise<void> => {
    await journey.clear();
  }, [journey]);

  const checkpointRedux = useCallback(async (): Promise<JourneySnapshot<TSlice>> => {
    const slice = selectorRef.current(storeRef.current.getState());
    return journey.checkpoint(slice, {
      exclude: options?.exclude,
    });
  }, [journey, options?.exclude]);

  return {
    journeyId,
    hasSavedProgress: recovery.available,
    status: recovery.status,
    restoreToRedux,
    clearReduxJourney,
    checkpointRedux,
  };
}

