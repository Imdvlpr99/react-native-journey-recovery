import { describe, it, expect } from 'vitest';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

describe('User Identity Scoping & Logout Clearing', () => {
  it('namespaces snapshots per userId so distinct users never overwrite each other', async () => {
    const storage = new MemoryStorageAdapter();

    // User A session
    const cpManagerUserA = new CheckpointManager(
      storage,
      undefined,
      '@rn_journey:',
      { userId: 'user_alice' }
    );
    await cpManagerUserA.save('checkout', { cart: ['Shoes'] }, { version: 1 });

    // User B session on the same device
    const cpManagerUserB = new CheckpointManager(
      storage,
      undefined,
      '@rn_journey:',
      { userId: 'user_bob' }
    );
    await cpManagerUserB.save('checkout', { cart: ['Laptop'] }, { version: 1 });

    // Assert User A and User B have separate stored checkpoints
    const aliceData = await cpManagerUserA.get<{ cart: string[] }>('checkout');
    const bobData = await cpManagerUserB.get<{ cart: string[] }>('checkout');

    expect(aliceData?.data.cart).toEqual(['Shoes']);
    expect(bobData?.data.cart).toEqual(['Laptop']);
  });

  it('clears all user-scoped journeys on logout without touching other users data', async () => {
    const storage = new MemoryStorageAdapter();

    const cpManagerA = new CheckpointManager(storage, undefined, '@rn_journey:', {
      userId: 'user_alice',
    });
    const cpManagerB = new CheckpointManager(storage, undefined, '@rn_journey:', {
      userId: 'user_bob',
    });

    await cpManagerA.save('flow1', { val: 1 }, { version: 1 });
    await cpManagerA.save('flow2', { val: 2 }, { version: 1 });
    await cpManagerB.save('flow1', { val: 99 }, { version: 1 });

    // Alice logs out: clear Alice's journeys
    await cpManagerA.clearUserJourneys('user_alice');

    // Alice's data is wiped
    expect(await cpManagerA.get('flow1')).toBeNull();
    expect(await cpManagerA.get('flow2')).toBeNull();

    // Bob's data is completely intact
    expect(await cpManagerB.get('flow1')).not.toBeNull();
  });
});

