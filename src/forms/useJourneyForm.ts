import { useEffect, useCallback, useRef } from 'react';
import { useJourney } from '../react/useJourney';
import { useRecovery } from '../react/useRecovery';
import { CheckpointOptions, JourneySnapshot } from '../types/checkpoint';
import { JourneyOptions } from '../types/journey';
import { RecoveryStatus } from '../types/recovery';

export interface FormLike<TFieldValues = Record<string, any>> {
  watch: (callback: (values: TFieldValues) => void) => { unsubscribe?: () => void } | (() => void);
  getValues: () => TFieldValues;
  reset: (values?: Partial<TFieldValues>) => void;
}

export interface UseJourneyFormOptions<TFieldValues = Record<string, any>> extends CheckpointOptions {
  autoSave?: boolean;
  debounceMs?: number;
  /** Load saved values into the form as soon as they are found, without asking. */
  autoRestore?: boolean;
  onRestored?: (values: TFieldValues) => void;
  /** Schema options for the journey (version, migrate, validate, expiryMode). */
  journey?: Omit<JourneyOptions<TFieldValues>, 'autoSave' | 'debounceMs'>;
}

export interface JourneyFormHandle<TFieldValues> {
  journeyId: string;
  hasSavedProgress: boolean;
  status: RecoveryStatus;
  restoreToForm: () => Promise<TFieldValues>;
  clearForm: () => Promise<void>;
  checkpointForm: () => Promise<JourneySnapshot<TFieldValues>>;
}

/**
 * Connects a form (React Hook Form or compatible form instance) to a journey recovery lifecycle.
 * Automatically synchronizes form values into checkpoints and allows restoring saved state into form.reset().
 */
export function useJourneyForm<TFieldValues extends Record<string, any> = Record<string, any>>(
  journeyId: string,
  form: FormLike<TFieldValues>,
  options?: UseJourneyFormOptions<TFieldValues>
): JourneyFormHandle<TFieldValues> {
  const journey = useJourney<TFieldValues>(journeyId, {
    ...options?.journey,
    autoSave: options?.autoSave ?? true,
    debounceMs: options?.debounceMs ?? 500,
  });

  const recovery = useRecovery<TFieldValues>(journeyId, { autoRestore: options?.autoRestore });

  const formRef = useRef(form);
  formRef.current = form;

  const onRestoredRef = useRef(options?.onRestored);
  onRestoredRef.current = options?.onRestored;

  // autoRestore: useRecovery restores on mount; load the result into the form once.
  const autoRestoredRef = useRef(false);
  useEffect(() => {
    if (options?.autoRestore && recovery.status === 'restored' && recovery.data && !autoRestoredRef.current) {
      autoRestoredRef.current = true;
      formRef.current.reset(recovery.data);
      onRestoredRef.current?.(recovery.data);
    }
  }, [options?.autoRestore, recovery.status, recovery.data]);

  // Latest save options without re-subscribing when callers pass inline arrays.
  const saveOptionsRef = useRef<CheckpointOptions>({});
  saveOptionsRef.current = { exclude: options?.exclude, expiry: options?.expiry };

  const { checkpoint, clear } = journey;
  const { restore } = recovery;

  // Subscribe to form value changes
  useEffect(() => {
    if (typeof form.watch !== 'function') {
      return;
    }

    const subscription = form.watch((values) => {
      checkpoint(values as TFieldValues, saveOptionsRef.current).catch(() => {
        // Immediate-save failures are reported via save_failed events and the provider's onError.
      });
    });

    return () => {
      if (typeof subscription === 'function') {
        subscription();
      } else if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [form, checkpoint]);

  const restoreToForm = useCallback(async (): Promise<TFieldValues> => {
    const restored = await restore();
    formRef.current.reset(restored);
    onRestoredRef.current?.(restored);
    return restored;
  }, [restore]);

  const clearForm = useCallback(async (): Promise<void> => {
    await clear();
    formRef.current.reset();
  }, [clear]);

  const checkpointForm = useCallback(async (): Promise<JourneySnapshot<TFieldValues>> => {
    return checkpoint(formRef.current.getValues(), saveOptionsRef.current);
  }, [checkpoint]);

  return {
    journeyId,
    hasSavedProgress: recovery.available,
    status: recovery.status,
    restoreToForm,
    clearForm,
    checkpointForm,
  };
}

