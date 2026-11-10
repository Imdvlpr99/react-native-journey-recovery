import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JourneyManager } from '../../src/core/JourneyManager';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';
import { JourneyRecoveryError } from '../../src/utils/errors';

describe('JourneyManager', () => {
  let storage: MemoryStorageAdapter;
  let checkpointManager: CheckpointManager;
  let journeyManager: JourneyManager;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
    checkpointManager = new CheckpointManager(storage);
    journeyManager = new JourneyManager(checkpointManager);
  });

  it('registers a journey and creates checkpoints via handle', async () => {
    const handle = journeyManager.registerJourney<{ step: number }>('checkout', {
      version: 1,
      expiry: 10000,
    });

    const snapshot = await handle.checkpoint({ step: 1 });
    expect(snapshot.id).toBe('checkout');
    expect(snapshot.data).toEqual({ step: 1 });
    expect(snapshot.version).toBe(1);

    const retrieved = await checkpointManager.get<{ step: number }>('checkout');
    expect(retrieved?.data).toEqual({ step: 1 });
  });

  it('migrates older schema version to current version when migrate function is provided', async () => {
    // Save older v1 schema manually in storage
    await checkpointManager.save(
      'user_profile',
      { fullName: 'John Doe' },
      { version: 1 }
    );

    // Register with v2 and migration function
    const migrateSpy = vi.fn().mockImplementation((oldData: any, oldVersion: number) => {
      const parts = oldData.fullName.split(' ');
      return {
        firstName: parts[0],
        lastName: parts[1],
      };
    });

    journeyManager.registerJourney<{ firstName: string; lastName: string }>(
      'user_profile',
      {
        version: 2,
        migrate: migrateSpy,
      }
    );

    const migratedSnapshot = await journeyManager.getMigratedSnapshot<{
      firstName: string;
      lastName: string;
    }>('user_profile');

    expect(migrateSpy).toHaveBeenCalledWith({ fullName: 'John Doe' }, 1);
    expect(migratedSnapshot?.data).toEqual({ firstName: 'John', lastName: 'Doe' });
    expect(migratedSnapshot?.version).toBe(2);
  });

  it('throws MIGRATION_FAILED when old schema has no migration handler', async () => {
    // Save v1 schema
    await checkpointManager.save('settings', { theme: 'dark' }, { version: 1 });

    // Register with v2 without migrate function
    journeyManager.registerJourney('settings', { version: 2 });

    await expect(journeyManager.getMigratedSnapshot('settings')).rejects.toThrow(
      JourneyRecoveryError
    );
    try {
      await journeyManager.getMigratedSnapshot('settings');
    } catch (err) {
      expect((err as JourneyRecoveryError).code).toBe('MIGRATION_FAILED');
    }
  });

  it('clears individual journey via handle', async () => {
    const handle = journeyManager.registerJourney('checkout', { version: 1 });
    await handle.checkpoint({ step: 1 });

    await handle.clear();

    const stored = await checkpointManager.get('checkout');
    expect(stored).toBeNull();
  });
});
