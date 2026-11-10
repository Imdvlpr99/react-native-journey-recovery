import { useEffect, useCallback, useRef } from 'react';
import { useJourney } from '../react/useJourney';
import { useRecovery } from '../react/useRecovery';
import { CheckpointOptions, JourneySnapshot } from '../types/checkpoint';
import { RecoveryStatus } from '../types/recovery';

export interface FormikLike<Values = Record<string, any>> {
  values: Values;
  setValues: (values: Values | ((prevValues: Values) => Values), shouldValidate?: boolean) => any;
  resetForm: (nextState?: any) => void;
  dirty?: boolean;
  isValid?: boolean;
}

export interface UseJourneyFormikOptions extends CheckpointOptions {
  autoSave?: boolean;
  debounceMs?: number;
  autoRestore?: boolean;
  syncOnChange?: boolean;
  onRestored?: (values: any) => void;
}

export interface JourneyFormikHandle<Values> {
  journeyId: string;
  hasSavedProgress: boolean;
  status: RecoveryStatus;
  restoreToFormik: () => Promise<Values>;
  clearFormik: () => Promise<void>;
  checkpointFormik: () => Promise<JourneySnapshot<Values>>;
}

/**
 * Connects a Formik instance to a journey recovery lifecycle.
 * Synchronizes Formik state into checkpoints and restores saved values into formik.setValues().
 */
export function useJourneyFormik<Values extends Record<string, any> = Record<string, any>>(
  journeyId: string,
  formik: FormikLike<Values>,
  options?: UseJourneyFormikOptions
): JourneyFormikHandle<Values> {
  const autoSave = options?.autoSave ?? true;

  const journey = useJourney<Values>(journeyId, {
    autoSave,
    debounceMs: options?.debounceMs ?? 500,
  });

  const recovery = useRecovery<Values>(journeyId);

  const formikRef = useRef(formik);
  formikRef.current = formik;

  const onRestoredRef = useRef(options?.onRestored);
  onRestoredRef.current = options?.onRestored;

  // Auto-restore Formik if configured
  useEffect(() => {
    if (options?.autoRestore && recovery.available && recovery.data) {
      formikRef.current.setValues(recovery.data);
      onRestoredRef.current?.(recovery.data);
    }
  }, [options?.autoRestore, recovery.available, recovery.data]);

  // Synchronize Formik values into journey checkpoints
  const initialMount = useRef(true);
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    if (options?.syncOnChange !== false && formik.values) {
      journey.checkpoint(formik.values, {
        exclude: options?.exclude,
        expiry: options?.expiry,
      });
    }
  }, [formik.values, options?.syncOnChange, journey, options?.exclude, options?.expiry]);

  const restoreToFormik = useCallback(async (): Promise<Values> => {
    const restored = await recovery.restore();
    formikRef.current.setValues(restored);
    onRestoredRef.current?.(restored);
    return restored;
  }, [recovery]);

  const clearFormik = useCallback(async (): Promise<void> => {
    await journey.clear();
    formikRef.current.resetForm();
  }, [journey]);

  const checkpointFormik = useCallback(async (): Promise<JourneySnapshot<Values>> => {
    return journey.checkpoint(formikRef.current.values, {
      exclude: options?.exclude,
      expiry: options?.expiry,
    });
  }, [journey, options?.exclude, options?.expiry]);

  return {
    journeyId,
    hasSavedProgress: recovery.available,
    status: recovery.status,
    restoreToFormik,
    clearFormik,
    checkpointFormik,
  };
}
