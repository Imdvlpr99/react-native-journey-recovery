import { describe, it, expect, beforeEach } from 'vitest';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

describe('Checkpoint History Stack', () => {
  let storage: MemoryStorageAdapter;
  let checkpointManager: CheckpointManager;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
    // Enable history with maxHistory = 5
    checkpointManager = new CheckpointManager(storage, undefined, '@rn_journey:', {
      enableHistory: true,
      maxHistory: 5,
    });
  });

  it('records chronological snapshot history when history is enabled', async () => {
    await checkpointManager.save('onboarding', { step: 1, name: 'Alice' }, { version: 1 });
    await checkpointManager.save('onboarding', { step: 2, role: 'Engineer' }, { version: 1 });
    await checkpointManager.save('onboarding', { step: 3, team: 'Mobile' }, { version: 1 });

    const history = await checkpointManager.getHistory<{ step: number }>('onboarding');

    expect(history.length).toBe(3);
    expect(history[0].data.step).toBe(1);
    expect(history[1].data.step).toBe(2);
    expect(history[2].data.step).toBe(3);
  });

  it('caps history size according to maxHistory config', async () => {
    for (let i = 1; i <= 8; i++) {
      await checkpointManager.save('counter', { count: i }, { version: 1 });
    }

    const history = await checkpointManager.getHistory<{ count: number }>('counter');

    expect(history.length).toBe(5);
    // Should retain the 5 most recent snapshots: 4, 5, 6, 7, 8
    expect(history[0].data.count).toBe(4);
    expect(history[4].data.count).toBe(8);
  });

  it('allows restoring to a specific historical checkpoint index', async () => {
    await checkpointManager.save('wizard', { step: 1 }, { version: 1 });
    await checkpointManager.save('wizard', { step: 2 }, { version: 1 });
    await checkpointManager.save('wizard', { step: 3 }, { version: 1 });

    // Rollback to index 1 (Step 2)
    const rolledBack = await checkpointManager.restoreFromHistory<{ step: number }>('wizard', 1);

    expect(rolledBack.data.step).toBe(2);

    // Latest active checkpoint in storage should now be step 2
    const current = await checkpointManager.get<{ step: number }>('wizard');
    expect(current?.data.step).toBe(2);
  });

  it('cleans up history when journey is deleted or cleared', async () => {
    await checkpointManager.save('temp', { data: 'val' }, { version: 1 });
    expect((await checkpointManager.getHistory('temp')).length).toBe(1);

    await checkpointManager.delete('temp');
    expect((await checkpointManager.getHistory('temp')).length).toBe(0);
  });
});

