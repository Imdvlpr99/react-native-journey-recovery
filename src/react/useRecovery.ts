import { useState, useEffect, useCallback, useRef } from 'react';
import { useRecoveryContext } from './RecoveryContext';
import { RecoveryState, RecoveryStatus } from '../types/recovery';
import { JourneySnapshot } from '../types/checkpoint';

export interface UseRecoveryOptions {
  /**
   * Automatically restore the journey on mount when a snapshot is available.
   * The restored data is populated into `state.data` immediately.
   */
  autoRestore?: boolean;
}

export function useRecovery<T>(journeyId: string, options?: UseRecoveryOptions): RecoveryState<T> {
  const { recoveryManager, lifecycleManager } = useRecoveryContext();

  const [available, setAvailable] = useState(false);
  const [status, setStatus] = useState<RecoveryStatus>('checking');
  const [data, setData] = useState<T | null>(null);
  const [snapshot, setSnapshot] = useState<JourneySnapshot<T> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);
  const autoRestore = options?.autoRestore ?? false;

  const reset = useCallback(() => {
    setAvailable(false);
    setStatus('idle');
    setData(null);
    setSnapshot(null);
    setError(null);
  }, []);

  const inspect = useCallback(
    async (allowAutoRestore: boolean) => {
      setStatus('checking');
      try {
        const result = await recoveryManager.check<T>(journeyId);
        if (!isMountedRef.current) return;

        setAvailable(result.available);
        setStatus(result.status);
        setSnapshot(result.snapshot);
        setError(result.error ?? null);

        if (allowAutoRestore && result.available) {
          setStatus('restoring');
          const restored = await recoveryManager.restore<T>(journeyId);
          if (!isMountedRef.current) return;
          setData(restored);
          setStatus('restored');
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        setAvailable(false);
        setStatus('failed');
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [recoveryManager, journeyId]
  );

  useEffect(() => {
    isMountedRef.current = true;
    inspect(autoRestore);
    return () => {
      isMountedRef.current = false;
    };
  }, [inspect, autoRestore]);

  // Another component cleared or discarded this journey: nothing is left to restore.
  useEffect(
    () =>
      lifecycleManager.onEvent(['cleared', 'discarded'], (event) => {
        if (event.journeyId === journeyId && isMountedRef.current) reset();
      }),
    [lifecycleManager, journeyId, reset]
  );

  const restore = useCallback(async (): Promise<T> => {
    setStatus('restoring');
    try {
      const restored = await recoveryManager.restore<T>(journeyId);
      if (isMountedRef.current) {
        setData(restored);
        setStatus('restored');
      }
      return restored;
    } catch (err) {
      if (isMountedRef.current) {
        setStatus('failed');
        setError(err instanceof Error ? err : new Error(String(err)));
      }
      throw err;
    }
  }, [recoveryManager, journeyId]);

  const discard = useCallback(async (): Promise<void> => {
    await recoveryManager.discard(journeyId);
    if (isMountedRef.current) reset();
  }, [recoveryManager, journeyId, reset]);

  const refresh = useCallback(() => inspect(false), [inspect]);

  return {
    available,
    status,
    data,
    snapshot,
    updatedAt: snapshot?.updatedAt,
    error,
    restore,
    discard,
    refresh,
  };
}
