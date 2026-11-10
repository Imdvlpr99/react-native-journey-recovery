import React from 'react';
import { MemoryStorageAdapter } from '../storage/MemoryStorageAdapter';
import {
  CheckpointManager,
  CheckpointSaveMetadata,
  CheckpointManagerOptions,
} from '../core/CheckpointManager';
import { JourneyManager } from '../core/JourneyManager';
import { RecoveryManager } from '../core/RecoveryManager';
import { LifecycleManager } from '../core/LifecycleManager';
import { RecoveryProvider, RecoveryProviderOptions } from '../react/RecoveryProvider';

export interface TestRecoveryEnvironmentOptions
  extends RecoveryProviderOptions,
    CheckpointManagerOptions {
  initialCheckpoints?: Record<string, { data: any; metadata?: CheckpointSaveMetadata }>;
}

export interface TestRecoveryEnvironment {
  storage: MemoryStorageAdapter;
  checkpointManager: CheckpointManager;
  journeyManager: JourneyManager;
  recoveryManager: RecoveryManager;
  lifecycleManager: LifecycleManager;
  wrapper: React.FC<{ children: React.ReactNode }>;
  seedCheckpoint: <T>(
    journeyId: string,
    data: T,
    metadata?: CheckpointSaveMetadata
  ) => Promise<void>;
}

/**
 * Creates a pre-wired, in-memory testing environment for writing Jest or Vitest
 * tests against components and hooks that integrate journey recovery.
 */
export function createTestRecoveryEnvironment(
  options?: TestRecoveryEnvironmentOptions
): TestRecoveryEnvironment {
  const storage = new MemoryStorageAdapter();

  const checkpointManager = new CheckpointManager(storage, {
    enableHistory: options?.enableHistory,
    maxHistory: options?.maxHistory,
    userId: options?.userId,
    maxSizeBytes: options?.maxSizeBytes,
  });

  const journeyManager = new JourneyManager(checkpointManager);
  const lifecycleManager = new LifecycleManager(journeyManager);
  const recoveryManager = new RecoveryManager(journeyManager, lifecycleManager);

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <RecoveryProvider storage={storage} options={options}>
      {children}
    </RecoveryProvider>
  );

  return {
    storage,
    checkpointManager,
    journeyManager,
    recoveryManager,
    lifecycleManager,
    wrapper,
    async seedCheckpoint<T>(journeyId: string, data: T, metadata?: CheckpointSaveMetadata) {
      await checkpointManager.save(journeyId, data, metadata ?? { version: 1 });
    },
  };
}

/**
 * Async factory variant of createTestRecoveryEnvironment that awaits initialCheckpoints persistence.
 */
export async function initTestRecoveryEnvironment(
  options?: TestRecoveryEnvironmentOptions
): Promise<TestRecoveryEnvironment> {
  const env = createTestRecoveryEnvironment(options);
  if (options?.initialCheckpoints) {
    for (const [id, item] of Object.entries(options.initialCheckpoints)) {
      await env.seedCheckpoint(id, item.data, item.metadata);
    }
  }
  return env;
}
