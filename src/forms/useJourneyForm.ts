import { useEffect, useCallback, useRef } from 'react';
import { useJourney } from '../react/useJourney';
import { useRecovery } from '../react/useRecovery';
import { CheckpointOptions, JourneySnapshot } from '../types/checkpoint';
import { RecoveryStatus } from '../types/recovery';

export interface FormLike<TFieldValues = Record<string, any>> {
  watch: (callback: (values: TFieldValues) => void) => { unsubscribe?: () => void } | (() => void);
  getValues: () => TFieldValues;
  reset: (values?: Partial<TFieldValues>) => void;
}

export interface UseJourneyFormOptions extends CheckpointOptions {
  autoSave?: boolean;
  debounceMs?: number;
  autoRestore?: boolean;
  onRestored?: (values: any) => void;
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
  options?: UseJourneyFormOptions
): JourneyFormHandle<TFieldValues> {
  const journey = useJourney<TFieldValues>(journeyId, {
    autoSave: options?.autoSave ?? true,
    debounceMs: options?.debounceMs ?? 500,
  });

  const recovery = useRecovery<TFieldValues>(journeyId);

  const formRef = useRef(form);
  formRef.current = form;

  const onRestoredRef = useRef(options?.onRestored);
  onRestoredRef.current = options?.onRestored;

  // Auto-restore form if configured
  useEffect(() => {
    if (options?.autoRestore && recovery.available && recovery.data) {
      formRef.current.reset(recovery.data);
      onRestoredRef.current?.(recovery.data);
    }
  }, [options?.autoRestore, recovery.available, recovery.data]);

  // Subscribe to form value changes
  useEffect(() => {
    if (typeof form.watch !== 'function') {
      return;
    }

    const subscription = form.watch((values) => {
      journey.checkpoint(values as TFieldValues, {
        exclude: options?.exclude,
        expiry: options?.expiry,
      });
    });

    return () => {
      if (typeof subscription === 'function') {
        subscription();
      } else if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [form, journey, options?.exclude, options?.expiry]);

  const restoreToForm = useCallback(async (): Promise<TFieldValues> => {
    const restored = await recovery.restore();
    formRef.current.reset(restored);
    onRestoredRef.current?.(restored);
    return restored;
  }, [recovery]);

  const clearForm = useCallback(async (): Promise<void> => {
    await journey.clear();
    formRef.current.reset();
  }, [journey]);

  const checkpointForm = useCallback(async (): Promise<JourneySnapshot<TFieldValues>> => {
    const values = formRef.current.getValues();
    return journey.checkpoint(values, {
      exclude: options?.exclude,
      expiry: options?.expiry,
    });
  }, [journey, options?.exclude, options?.expiry]);

  return {
    journeyId,
    hasSavedProgress: recovery.available,
    status: recovery.status,
    restoreToForm,
    clearForm,
    checkpointForm,
  };
}
