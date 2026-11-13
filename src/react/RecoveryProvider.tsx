import React, { useMemo, useEffect, useRef } from 'react';
import { StorageAdapter } from '../types/storage';
import { RecoveryEvent } from '../types/recovery';
import { ExpiryMode } from '../types/journey';
import { CheckpointManager, SnapshotTransform } from '../core/CheckpointManager';
import { JourneyManager } from '../core/JourneyManager';
import { RecoveryManager } from '../core/RecoveryManager';
import { LifecycleManager } from '../core/LifecycleManager';
import { JourneyRecoveryError } from '../utils/errors';
import { RecoveryContext, RecoveryContextValue } from './RecoveryContext';

export interface AppStateLike {
  addEventListener(
    type: 'change',
    listener: (state: string) => void
  ): { remove: () => void } | void;
}

export interface RecoveryProviderOptions {
  autoSave?: boolean;
  debounceMs?: number;
  defaultExpiry?: number;
  /** How expiry is measured by default: from the last save (`'sliding'`) or the first (`'absolute'`). */
  expiryMode?: ExpiryMode;
  keyPrefix?: string;
  flushOnBackground?: boolean;
  appState?: AppStateLike;
  userId?: string;
  /** Maximum serialized snapshot size in bytes. Default 512 KB. */
  maxSizeBytes?: number;
  /** Encode/decode hook around storage, for encryption or signing. Keep the instance stable. */
  transform?: SnapshotTransform;
}

export interface RecoveryProviderProps {
  storage: StorageAdapter;
  options?: RecoveryProviderOptions;
  onRecovery?: (event: RecoveryEvent) => void;
  /**
   * Called when a checkpoint fails to save, including debounced auto-saves and
   * background flushes that have no caller to receive the error.
   */
  onError?: (error: JourneyRecoveryError, journeyId: string) => void;
  children: React.ReactNode;
}

export const RecoveryProvider: React.FC<RecoveryProviderProps> = ({
  storage,
  options,
  onRecovery,
  onError,
  children,
}) => {
  const onRecoveryRef = useRef(onRecovery);
  onRecoveryRef.current = onRecovery;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const value = useMemo<RecoveryContextValue>(() => {
    const checkpointManager = new CheckpointManager(storage, undefined, options?.keyPrefix, {
      userId: options?.userId,
      maxSizeBytes: options?.maxSizeBytes,
      transform: options?.transform,
    });
    const journeyManager = new JourneyManager(checkpointManager);
    const lifecycleManager = new LifecycleManager(journeyManager);
    const recoveryManager = new RecoveryManager(journeyManager, lifecycleManager);

    return {
      storage,
      journeyManager,
      recoveryManager,
      lifecycleManager,
      defaultExpiry: options?.defaultExpiry,
      expiryMode: options?.expiryMode,
      autoSave: options?.autoSave,
      debounceMs: options?.debounceMs,
    };
  }, [
    storage,
    options?.keyPrefix,
    options?.defaultExpiry,
    options?.expiryMode,
    options?.autoSave,
    options?.debounceMs,
    options?.userId,
    options?.maxSizeBytes,
    options?.transform,
  ]);

  useEffect(() => {
    const unsubscribe = value.lifecycleManager.subscribe((event) => {
      onRecoveryRef.current?.(event);
      if (event.type === 'save_failed' && event.error) {
        onErrorRef.current?.(event.error, event.journeyId);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [value]);

  // Best-effort flush of pending auto-saves when the app leaves the foreground.
  useEffect(() => {
    if (options?.appState && options.flushOnBackground !== false) {
      const sub = options.appState.addEventListener('change', (nextState: string) => {
        if (nextState === 'background' || nextState === 'inactive') {
          // Failures are reported through onError / save_failed events.
          value.lifecycleManager.flush().catch(() => {});
        }
      });
      return () => {
        if (sub && typeof sub.remove === 'function') {
          sub.remove();
        }
      };
    }
  }, [options?.appState, options?.flushOnBackground, value]);

  return <RecoveryContext.Provider value={value}>{children}</RecoveryContext.Provider>;
};
