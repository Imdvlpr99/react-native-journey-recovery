import { useState, useEffect, useCallback, useRef } from 'react';
import { useRecoveryContext } from './RecoveryContext';
import { RecoveryState, RecoveryStatus } from '../types/recovery';
import { JourneySnapshot } from '../types/checkpoint';

export function useRecovery<T>(journeyId: string): RecoveryState<T> {
  const { recoveryManager } = useRecoveryContext();

  const [available, setAvailable] = useState(false);
  const [status, setStatus] = useState<RecoveryStatus>('checking');
  const [data, setData] = useState<T | null>(null);
  const [snapshot, setSnapshot] = useState<JourneySnapshot<T> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);

  const inspect = useCallback(async () => {
    setStatus('checking');
    try {
      const result = await recoveryManager.check<T>(journeyId);
      if (!isMountedRef.current) return;

      setAvailable(result.available);
      setStatus(result.status);
      setSnapshot(result.snapshot);
      setError(result.error ?? null);
    } catch (err) {
      if (!isMountedRef.current) return;
      setAvailable(false);
      setStatus('failed');
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [recoveryManager, journeyId]);

  useEffect(() => {
    isMountedRef.current = true;
    inspect();
    return () => {
      isMountedRef.current = false;
    };
  }, [inspect]);

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
    if (isMountedRef.current) {
      setAvailable(false);
      setStatus('idle');
      setData(null);
      setSnapshot(null);
      setError(null);
    }
  }, [recoveryManager, journeyId]);

  return {
    available,
    status,
    data,
    snapshot,
    updatedAt: snapshot?.updatedAt,
    error,
    restore,
    discard,
  };
}
