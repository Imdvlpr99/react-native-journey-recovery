import React, { useMemo, useEffect, useRef } from 'react';
import { StorageAdapter } from '../types/storage';
import { RecoveryEvent } from '../types/recovery';
import { CheckpointManager } from '../core/CheckpointManager';
import { JourneyManager } from '../core/JourneyManager';
import { RecoveryManager } from '../core/RecoveryManager';
import { LifecycleManager } from '../core/LifecycleManager';
import { RecoveryContext, RecoveryContextValue } from './RecoveryContext';

export interface RecoveryProviderOptions {
  autoSave?: boolean;
  debounceMs?: number;
  defaultExpiry?: number;
  keyPrefix?: string;
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
    const checkpointManager = new CheckpointManager(storage, undefined, options?.keyPrefix);
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

  return <RecoveryContext.Provider value={value}>{children}</RecoveryContext.Provider>;
};
