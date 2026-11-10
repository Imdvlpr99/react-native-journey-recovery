import React, { useMemo, useEffect, useRef } from 'react';
import { StorageAdapter } from '../types/storage';
import { RecoveryEvent } from '../types/recovery';
import { CheckpointManager } from '../core/CheckpointManager';
import { JourneyManager } from '../core/JourneyManager';
import { RecoveryManager } from '../core/RecoveryManager';
import { LifecycleManager } from '../core/LifecycleManager';
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
  keyPrefix?: string;
  flushOnBackground?: boolean;
  appState?: AppStateLike;
  userId?: string;
  enableHistory?: boolean;
  maxHistory?: number;
}

export interface RecoveryProviderProps {
  storage: StorageAdapter;
  options?: RecoveryProviderOptions;
  onRecovery?: (event: RecoveryEvent) => void;
  children: React.ReactNode;
}

export const RecoveryProvider: React.FC<RecoveryProviderProps> = ({
  storage,
  options,
  onRecovery,
  children,
}) => {
  const onRecoveryRef = useRef(onRecovery);
  onRecoveryRef.current = onRecovery;

  const value = useMemo<RecoveryContextValue>(() => {
    const checkpointManager = new CheckpointManager(
      storage,
      undefined,
      options?.keyPrefix,
      {
        userId: options?.userId,
        enableHistory: options?.enableHistory,
        maxHistory: options?.maxHistory,
      }
    );
    const journeyManager = new JourneyManager(checkpointManager);
    const lifecycleManager = new LifecycleManager(journeyManager);
    const recoveryManager = new RecoveryManager(journeyManager, lifecycleManager);

    return {
      storage,
      journeyManager,
      recoveryManager,
      lifecycleManager,
      defaultExpiry: options?.defaultExpiry,
      autoSave: options?.autoSave,
      debounceMs: options?.debounceMs,
    };
  }, [storage, options?.keyPrefix, options?.defaultExpiry, options?.autoSave, options?.debounceMs]);

  useEffect(() => {
    const unsubscribe = value.lifecycleManager.subscribe((event) => {
      onRecoveryRef.current?.(event);
    });
    return () => {
      unsubscribe();
    };
  }, [value]);

  // Hook into AppState lifecycle to perform best-effort flush when app backgrounds
  useEffect(() => {
    if (options?.appState && options.flushOnBackground !== false) {
      const sub = options.appState.addEventListener('change', (nextState: string) => {
        if (nextState === 'background' || nextState === 'inactive') {
          value.lifecycleManager.flush();
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
