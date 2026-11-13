import { describe, it, expect } from 'vitest';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { JourneyManager } from '../../src/core/JourneyManager';
import { RecoveryManager } from '../../src/core/RecoveryManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

// ---------------------------------------------------------------------------
// Real-world journey scenarios
// ---------------------------------------------------------------------------

describe('Journey Scenarios — integration', () => {
  // -------------------------------------------------------------------------
  // Scenario 1: User crashes mid-checkout, comes back and recovers
  // -------------------------------------------------------------------------

  it('Checkout crash recovery: saves mid-flow state and restores it', async () => {
    const storage = new MemoryStorageAdapter();
    const cm = new CheckpointManager(storage);
    const jm = new JourneyManager(cm);
    const rm = new RecoveryManager(jm);

    // User filled in items and address, then app crashed before payment
    await cm.save(
      'checkout',
      { items: ['book', 'pen'], address: '123 Main St', step: 2 },
      { version: 1, expiry: 86_400_000 } // 24h TTL
    );

    const result = await rm.check('checkout');
    expect(result.available).toBe(true);
    expect(result.status).toBe('available');

    const restored = await rm.restore<{ items: string[]; address: string; step: number }>(
      'checkout'
    );
    expect(restored.items).toEqual(['book', 'pen']);
    expect(restored.address).toBe('123 Main St');
    expect(restored.step).toBe(2);

    // After completing checkout, mark as done
    await cm.save('checkout', { ...restored, step: 3 }, { version: 1 }, { completed: true });

    const finalSnap = await cm.get('checkout');
    expect(finalSnap?.status).toBe('completed');
  });

  // -------------------------------------------------------------------------
  // Scenario 2: Expired journey — TTL elapsed, user starts fresh
  // -------------------------------------------------------------------------

  it('Expired journey: returns expired status, restore throws', async () => {
    const storage = new MemoryStorageAdapter();
    const cm = new CheckpointManager(storage);
    const jm = new JourneyManager(cm);
    const rm = new RecoveryManager(jm);

    // Save with a negative expiry so it's already expired
    await cm.save('signup', { email: 'alice@test.com', step: 1 }, { version: 1 }, { expiry: -1 });

    const result = await rm.check('signup');
    expect(result.available).toBe(false);
    expect(result.status).toBe('expired');

    // Attempting to restore an expired snapshot should throw
    await expect(rm.restore('signup')).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // Scenario 3: Corrupted snapshot — tampering detected via checksum
  // -------------------------------------------------------------------------

  it('Corrupted snapshot: tampering detected, returns invalid status', async () => {
    const storage = new MemoryStorageAdapter();
    const cm = new CheckpointManager(storage);
    const jm = new JourneyManager(cm);
    const rm = new RecoveryManager(jm);

    await cm.save('payment', { amount: 50 }, { version: 1, expiry: 60_000 });

    // Tamper the stored value
    const key = cm.getKey('payment');
    const raw = await storage.getItem(key);
    const parsed = JSON.parse(raw!);
    parsed.data.amount = 9999;
    await storage.setItem(key, JSON.stringify(parsed));

    const result = await rm.check('payment');
    expect(result.available).toBe(false);
    expect(result.error?.code).toBe('SNAPSHOT_CORRUPTED');
  });

  // -------------------------------------------------------------------------
  // Scenario 4: Schema migration — old data promoted to new version
  // -------------------------------------------------------------------------

  it('Schema migration: old v1 snapshot migrates to v2 schema on restore', async () => {
    const storage = new MemoryStorageAdapter();
    const cm = new CheckpointManager(storage);
    const jm = new JourneyManager(cm);
    const rm = new RecoveryManager(jm);

    // Persist a v1 snapshot
    await cm.save('profile', { name: 'Bob' }, { version: 1, expiry: 60_000 });

    // Register the journey with a migration function
    jm.registerJourney<{ name: string; displayName: string }>('profile', {
      version: 2,
      migrate: (old: { name: string }, oldVersion: number) => {
        if (oldVersion < 2) {
          return { name: (old as any).name, displayName: (old as any).name.toUpperCase() };
        }
        return old as any;
      },
    });

    const result = await rm.check<{ name: string; displayName: string }>('profile');
    // Migration is transparent to check — it reports available
    expect(result.available).toBe(true);

    const restored = await rm.restore<{ name: string; displayName: string }>('profile');
    expect(restored.name).toBe('Bob');
    expect(restored.displayName).toBe('BOB');
  });

  // -------------------------------------------------------------------------
  // Scenario 5: Discard — user explicitly abandons their in-progress form
  // -------------------------------------------------------------------------

  it('Discard journey: snapshot is removed and check returns idle', async () => {
    const storage = new MemoryStorageAdapter();
    const cm = new CheckpointManager(storage);
    const jm = new JourneyManager(cm);
    const rm = new RecoveryManager(jm);

    await cm.save('onboarding', { step: 3, name: 'Carol' }, { version: 1, expiry: 60_000 });

    const before = await rm.check('onboarding');
    expect(before.available).toBe(true);

    await rm.discard('onboarding');

    const after = await rm.check('onboarding');
    expect(after.available).toBe(false);
    expect(after.status).toBe('idle');
    // No error expected for a clean discard
    expect(after.error).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Scenario 6: Multiple concurrent journeys — isolated state
  // -------------------------------------------------------------------------

  it('Concurrent journeys: independent checkpoints do not interfere', async () => {
    const storage = new MemoryStorageAdapter();
    const cm = new CheckpointManager(storage);
    const jm = new JourneyManager(cm);
    const rm = new RecoveryManager(jm);

    await Promise.all([
      cm.save('checkout', { step: 1 }, { version: 1, expiry: 60_000 }),
      cm.save('signup', { step: 2 }, { version: 1, expiry: 60_000 }),
      cm.save('profile', { step: 3 }, { version: 1, expiry: 60_000 }),
    ]);

    const [c, s, p] = await Promise.all([
      rm.restore<{ step: number }>('checkout'),
      rm.restore<{ step: number }>('signup'),
      rm.restore<{ step: number }>('profile'),
    ]);

    expect(c.step).toBe(1);
    expect(s.step).toBe(2);
    expect(p.step).toBe(3);
  });

  // -------------------------------------------------------------------------
  // Scenario 7: Rapid successive saves — only last write persists
  // -------------------------------------------------------------------------

  it('Rapid successive saves: last write wins via queue', async () => {
    const storage = new MemoryStorageAdapter();
    const cm = new CheckpointManager(storage);

    const saves = Array.from({ length: 10 }, (_, i) =>
      cm.save('cart', { count: i + 1 }, { version: 1 })
    );

    await Promise.all(saves);

    const snap = await cm.get<{ count: number }>('cart');
    // All 10 writes should complete; the final state should have count = 10
    expect(snap?.data.count).toBe(10);
  });
});
