import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useRecoveryContext } from './RecoveryContext';
import { JourneyOptions, JourneyHandle } from '../types/journey';
import { CheckpointOptions, JourneySnapshot } from '../types/checkpoint';
import { RecoveryStatus } from '../types/recovery';

export function useJourney<T>(
  journeyId: string,
  options?: JourneyOptions<T>
): JourneyHandle<T> {
  const {
    journeyManager,
    lifecycleManager,
    defaultExpiry,
    expiryMode: providerExpiryMode,
    autoSave: providerAutoSave,
    debounceMs: providerDebounceMs,
  } = useRecoveryContext();

  const [state, setState] = useState<{ status: RecoveryStatus; error: Error | null }>(() =>
    journeyManager.getJourneyState(journeyId)
  );

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Destructure to primitive deps — avoids re-registering when caller passes inline object
  const optVersion = options?.version;
  const optExpiry = options?.expiry;
  const optExpiryMode = options?.expiryMode;
  const optAutoSave = options?.autoSave;
  const optDebounceMs = options?.debounceMs;
  const optValidate = options?.validate;
  const optMigrate = options?.migrate;

  const mergedOptions = useMemo<JourneyOptions<T>>(() => {
    const own = optionsRef.current ?? {};
    return {
      version: own.version ?? 1,
      expiry: own.expiry ?? defaultExpiry,
      expiryMode: own.expiryMode ?? providerExpiryMode,
      autoSave: own.autoSave ?? providerAutoSave,
      debounceMs: own.debounceMs ?? providerDebounceMs,
      validate: own.validate,
      migrate: own.migrate,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    defaultExpiry,
    providerExpiryMode,
    providerAutoSave,
    providerDebounceMs,
    optVersion,
    optExpiry,
    optExpiryMode,
    optAutoSave,
    optDebounceMs,
    optValidate,
    optMigrate,
  ]);

  const handle = useMemo(() => {
    return journeyManager.registerJourney<T>(journeyId, mergedOptions, {
      allowDuplicate: true,
    });
  }, [journeyManager, journeyId, mergedOptions]);

  // Follow save results from the engine, including debounced writes that finish later.
  useEffect(() => {
    setState(journeyManager.getJourneyState(journeyId));
    return lifecycleManager.subscribe((event) => {
      if (event.journeyId !== journeyId) return;
      if (event.type === 'saved') setState({ status: 'active', error: null });
      else if (event.type === 'save_failed') setState({ status: 'failed', error: event.error ?? null });
      else if (event.type === 'cleared' || event.type === 'discarded') setState({ status: 'idle', error: null });
    });
  }, [journeyManager, lifecycleManager, journeyId]);

  const checkpoint = useCallback(
    async (data: T, checkpointOpts?: CheckpointOptions): Promise<JourneySnapshot<T>> => {
      setState((prev) => (prev.status === 'active' ? prev : { status: 'active', error: prev.error }));
      return handle.checkpoint(data, checkpointOpts);
    },
    [handle]
  );

  const clear = useCallback(async (): Promise<void> => {
    await handle.clear();
  }, [handle]);

  const flush = useCallback((): Promise<void> => handle.flush(), [handle]);

  // Flush on unmount so pending debounced changes are persisted.
  useEffect(() => {
    return () => {
      // Failures surface through save_failed events / the provider's onError.
      journeyManager.flushPending(journeyId).catch(() => {});
    };
  }, [journeyManager, journeyId]);

  return {
    id: journeyId,
    status: state.status,
    error: state.error,
    checkpoint,
    clear,
    flush,
  };
}
