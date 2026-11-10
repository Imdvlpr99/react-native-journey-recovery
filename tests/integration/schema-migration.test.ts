import { describe, it, expect } from 'vitest';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { JourneyManager } from '../../src/core/JourneyManager';
import { RecoveryManager } from '../../src/core/RecoveryManager';

describe('Integration: Schema Migration Pipeline', () => {
  it('migrates legacy stored checkpoint data to new schema structure upon recovery', async () => {
    const storage = new MemoryStorageAdapter();
    const cpManager = new CheckpointManager(storage);

    // Save v1 checkpoint: { address: '123 Main St, Springfield, IL' }
    await cpManager.save(
      'checkout-address',
      { address: '123 Main St, Springfield, IL' },
      { version: 1 }
    );

    // Initialize v2 engine where address is structured object
    const journeyManager = new JourneyManager(cpManager);
    journeyManager.registerJourney<{
      street: string;
      city: string;
      state: string;
    }>('checkout-address', {
      version: 2,
      migrate: (oldData: any, oldVersion: number) => {
        expect(oldVersion).toBe(1);
        const parts = oldData.address.split(', ');
        return {
          street: parts[0],
          city: parts[1],
          state: parts[2],
        };
      },
    });

    const recoveryManager = new RecoveryManager(journeyManager);

    const restored = await recoveryManager.restore<{
      street: string;
      city: string;
      state: string;
    }>('checkout-address');

    expect(restored).toEqual({
      street: '123 Main St',
      city: 'Springfield',
      state: 'IL',
    });

    // Check that storage is updated to version 2
    const inStorage = await cpManager.get('checkout-address');
    expect(inStorage?.version).toBe(2);
  });
});

