import { createContext, useContext } from 'react';
import { JourneyManager } from '../core/JourneyManager';
import { RecoveryManager } from '../core/RecoveryManager';
import { LifecycleManager } from '../core/LifecycleManager';
import { StorageAdapter } from '../types/storage';
import { ExpiryMode } from '../types/journey';

export interface RecoveryContextValue {
  storage: StorageAdapter;
  journeyManager: JourneyManager;
  recoveryManager: RecoveryManager;
  lifecycleManager: LifecycleManager;
  defaultExpiry?: number;
  expiryMode?: ExpiryMode;
  autoSave?: boolean;
  debounceMs?: number;
}

export const RecoveryContext = createContext<RecoveryContextValue | null>(null);

export function useRecoveryContext(): RecoveryContextValue {
  const ctx = useContext(RecoveryContext);
  if (!ctx) {
    throw new Error('useRecoveryContext must be used within a RecoveryProvider');
  }
  return ctx;
}

