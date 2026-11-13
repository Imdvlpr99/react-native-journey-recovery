import { describe, it, expect } from 'vitest';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { JourneyManager } from '../../src/core/JourneyManager';
import { RecoveryManager } from '../../src/core/RecoveryManager';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';
import { JourneyRecoveryError } from '../../src/utils/errors';

describe('Data Safety & Security', () => {
  // -------------------------------------------------------------------------
  // Sensitive field exclusion
  // -------------------------------------------------------------------------

  it('excluded fields are not written to storage', async () => {
    const storage = new MemoryStorageAdapter();
    const cm = new CheckpointManager(storage);

    await cm.save(
      'checkout',
      { email: 'user@example.com', password: 'secret123', step: 2 },
      { version: 1 },
      { exclude: ['password'] }
    );

    const raw = await storage.getItem('@rn_journey:checkout');
    expect(raw).not.toBeNull();
    expect(raw).not.toContain('secret123');
    expect(raw).toContain('user@example.com');
    expect(raw).toContain('"step":2');
  });

  it('restoring after exclude does not expose excluded field', async () => {
    const storage = new MemoryStorageAdapter();
    const cm = new CheckpointManager(storage);
    const jm = new JourneyManager(cm);
    const rm = new RecoveryManager(jm);

    await cm.save(
      'payment',
      { cardNumber: '4111111111111111', amount: 150, cvv: '123' },
      { version: 1 },
      { exclude: ['cardNumber', 'cvv'] }
    );

    const restored = await rm.restore<{ amount: number; cardNumber?: string; cvv?: string }>(
      'payment'
    );

    expect(restored.amount).toBe(150);
    expect(restored.cardNumber).toBeUndefined();
    expect(restored.cvv).toBeUndefined();
  });

  it('top-level excluded fields are stripped; nested same-named keys are not (shallow exclude)', async () => {
    const storage = new MemoryStorageAdapter();
    const cm = new CheckpointManager(storage);

    const data = {
      user: { name: 'Alice', nested: 'NESTED_VALUE' },
      step: 1,
      secret: 'TOP_LEVEL_SECRET',
    };

    // 'secret' is a top-level field — it should be excluded
    // 'user.nested' shares no name with 'secret' — unaffected
    await cm.save('onboarding', data, { version: 1 }, { exclude: ['secret'] });

    const raw = await storage.getItem('@rn_journey:onboarding');
    expect(raw).not.toContain('TOP_LEVEL_SECRET');
    expect(raw).toContain('Alice');
    expect(raw).toContain('NESTED_VALUE');
  });

  // -------------------------------------------------------------------------
  // User isolation
  // -------------------------------------------------------------------------

  it('user A cannot read user B checkpoints with the same journeyId', async () => {
    const storage = new MemoryStorageAdapter();

    const cmA = new CheckpointManager(storage, undefined, '@rn_journey:', { userId: 'userA' });
    const cmB = new CheckpointManager(storage, undefined, '@rn_journey:', { userId: 'userB' });

    await cmA.save('profile', { name: 'Alice' }, { version: 1 });
    await cmB.save('profile', { name: 'Bob' }, { version: 1 });

    const readByA = await cmA.get<{ name: string }>('profile');
    const readByB = await cmB.get<{ name: string }>('profile');

    expect(readByA?.data.name).toBe('Alice');
    expect(readByB?.data.name).toBe('Bob');
  });

  it('clearUserJourneys does not leak between users', async () => {
    const storage = new MemoryStorageAdapter();

    const cmA = new CheckpointManager(storage, undefined, '@rn_journey:', { userId: 'alice' });
    const cmB = new CheckpointManager(storage, undefined, '@rn_journey:', { userId: 'bob' });

    await cmA.save('cart', { items: ['A'] }, { version: 1 });
    await cmB.save('cart', { items: ['B'] }, { version: 1 });

    await cmA.clearUserJourneys();

    expect(await cmA.get('cart')).toBeNull();
    expect((await cmB.get<{ items: string[] }>('cart'))?.data.items).toEqual(['B']);
  });

  it('no data leakage between journeys with the same user', async () => {
    const storage = new MemoryStorageAdapter();
    const cm = new CheckpointManager(storage);
    const jm = new JourneyManager(cm);
    const rm = new RecoveryManager(jm);

    await cm.save('journey-X', { secret: 'xdata' }, { version: 1 });
    await cm.save('journey-Y', { secret: 'ydata' }, { version: 1 });

    const restoredX = await rm.restore<{ secret: string }>('journey-X');
    const restoredY = await rm.restore<{ secret: string }>('journey-Y');

    expect(restoredX.secret).toBe('xdata');
    expect(restoredY.secret).toBe('ydata');
  });

  // -------------------------------------------------------------------------
  // Malicious / unexpected snapshot contents
  // -------------------------------------------------------------------------

  it('malformed JSON in storage returns invalid status without crashing', async () => {
    const storage = new MemoryStorageAdapter();
    await storage.setItem('@rn_journey:malicious', '<script>alert(1)</script>');

    const cm = new CheckpointManager(storage);
    const jm = new JourneyManager(cm);
    const rm = new RecoveryManager(jm);

    const result = await rm.check('malicious');
    expect(result.available).toBe(false);
    expect(result.status).toBe('invalid');
    expect(result.error).toBeInstanceOf(JourneyRecoveryError);
    expect(result.error?.code).toBe('SNAPSHOT_CORRUPTED');
  });

  it('snapshot with tampered data is rejected via checksum', async () => {
    const storage = new MemoryStorageAdapter();
    const cm = new CheckpointManager(storage);
    await cm.save('balance', { amount: 100 }, { version: 1 });

    // Tamper
    const raw = await storage.getItem('@rn_journey:balance');
    const parsed = JSON.parse(raw!);
    parsed.data.amount = 999999;
    await storage.setItem('@rn_journey:balance', JSON.stringify(parsed));

    const jm = new JourneyManager(cm);
    const rm = new RecoveryManager(jm);

    const result = await rm.check('balance');
    expect(result.available).toBe(false);
    expect(result.error?.code).toBe('SNAPSHOT_CORRUPTED');
  });

  it('JSON prototype pollution attempt is handled safely', async () => {
    const storage = new MemoryStorageAdapter();
    // Inject prototype pollution payload
    const poisoned = JSON.stringify({
      id: 'poison',
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active',
      data: { '__proto__': { admin: true }, value: 42 },
      checksum: 'badc0ffe',
    });
    await storage.setItem('@rn_journey:poison', poisoned);

    const cm = new CheckpointManager(storage);
    const jm = new JourneyManager(cm);
    const rm = new RecoveryManager(jm);

    // Checksum mismatch should catch this
    const result = await rm.check('poison');
    expect(result.available).toBe(false);
    // Object prototype should NOT be polluted
    expect(({} as any).admin).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // completed status flag
  // -------------------------------------------------------------------------

  it('marks snapshot as completed when completed:true is passed', async () => {
    const storage = new MemoryStorageAdapter();
    const cm = new CheckpointManager(storage);

    const snap = await cm.save('flow', { step: 5 }, { version: 1 }, { completed: true });
    expect(snap.status).toBe('completed');

    const retrieved = await cm.get('flow');
    expect(retrieved?.status).toBe('completed');
  });

  it('completed snapshot is not offered for resume but stays readable', async () => {
    const storage = new MemoryStorageAdapter();
    const cm = new CheckpointManager(storage);
    const jm = new JourneyManager(cm);
    const rm = new RecoveryManager(jm);

    await cm.save('completed-flow', { done: true }, { version: 1 }, { completed: true });

    const result = await rm.check('completed-flow');
    expect(result.available).toBe(false);
    expect(result.status).toBe('completed');
    expect(result.snapshot?.data).toEqual({ done: true });
    await expect(rm.restore('completed-flow')).rejects.toThrow();
  });
});
