import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useRecoveryContext } from './RecoveryContext';
import { JourneyOptions, JourneyHandle } from '../types/journey';
import { CheckpointOptions, JourneySnapshot } from '../types/checkpoint';
import { RecoveryStatus } from '../types/recovery';

export function useJourney<T>(
  journeyId: string,
  options?: JourneyOptions<T>
): JourneyHandle<T> {
  const { journeyManager, defaultExpiry, autoSave: providerAutoSave, debounceMs: providerDebounceMs } =
    useRecoveryContext();

  const [status, setStatus] = useState<RecoveryStatus>('idle');

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mergedOptions = useMemo<JourneyOptions<T>>(() => {
    return {
      version: 1,
      expiry: defaultExpiry,
      autoSave: providerAutoSave,
      debounceMs: providerDebounceMs,
      ...options,
    };
  }, [defaultExpiry, providerAutoSave, providerDebounceMs, options]);

  const handle = useMemo(() => {
    return journeyManager.registerJourney<T>(journeyId, mergedOptions, {
      allowDuplicate: true,
    });
  }, [journeyManager, journeyId, mergedOptions]);

  const checkpoint = useCallback(
    async (data: T, checkpointOpts?: CheckpointOptions): Promise<JourneySnapshot<T>> => {
      setStatus('active' as RecoveryStatus);
      try {
        const snap = await handle.checkpoint(data, checkpointOpts);
        return snap;
      } catch (err) {
        setStatus('failed');
        throw err;
      }
    },
    [handle]
  );

  const clear = useCallback(async (): Promise<void> => {
    await handle.clear();
    setStatus('idle');
  }, [handle]);

  // Flush on unmount to make sure pending debounced changes are persisted
  useEffect(() => {
    return () => {
      journeyManager.flushPending(journeyId);
    };
  }, [journeyManager, journeyId]);

  return {
    id: journeyId,
    status,
    checkpoint,
    clear,
  };
}

