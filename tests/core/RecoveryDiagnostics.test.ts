import { describe, it, expect, beforeEach } from 'vitest';
import { JourneyManager } from '../../src/core/JourneyManager';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { RecoveryManager } from '../../src/core/RecoveryManager';
import { getRecoveryDiagnostics } from '../../src/core/RecoveryDiagnostics';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

describe('RecoveryDiagnostics', () => {
  let storage: MemoryStorageAdapter;
  let cpManager: CheckpointManager;
  let journeyManager: JourneyManager;
  let recoveryManager: RecoveryManager;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
    cpManager = new CheckpointManager(storage);
    journeyManager = new JourneyManager(cpManager);
    recoveryManager = new RecoveryManager(journeyManager);
  });

  it('reports idle and unrecoverable diagnostics when no checkpoint exists', async () => {
    const diag = await recoveryManager.getDiagnostics('non-existent');

    expect(diag.exists).toBe(false);
    expect(diag.status).toBe('idle');
    expect(diag.isRecoverable).toBe(false);
    expect(diag.payloadSizeBytes).toBe(0);
    expect(diag.snapshot).toBeNull();
  });

  it('reports full metrics for a valid, healthy checkpoint', async () => {
    journeyManager.registerJourney('checkout', { version: 1, expiry: 60000 });
    await journeyManager.checkpoint('checkout', { step: 2, total: 150 });

    const diag = await recoveryManager.getDiagnostics('checkout');

    expect(diag.exists).toBe(true);
    expect(diag.status).toBe('available');
    expect(diag.isRecoverable).toBe(true);
    expect(diag.formatVersion).toBe(1);
    expect(diag.schemaVersion).toBe(1);
    expect(diag.payloadSizeBytes).toBeGreaterThan(0);
    expect(diag.hasChecksum).toBe(true);
    expect(diag.checksumValid).toBe(true);
    expect(diag.isExpired).toBe(false);
    expect(diag.timeUntilExpiryMs).toBeGreaterThan(0);
    expect(diag.isEligibleForMigration).toBe(false);
    expect(diag.snapshot?.data).toEqual({ step: 2, total: 150 });
  });

  it('detects tampered/corrupted checksum', async () => {
    await cpManager.save('corrupted-journey', { balance: 500 });

    // Directly tamper with the raw storage data
    const raw = await storage.getItem('@rn_journey:corrupted-journey');
    const parsed = JSON.parse(raw!);
    parsed.data.balance = 999999; // Tampered without updating checksum
    await storage.setItem('@rn_journey:corrupted-journey', JSON.stringify(parsed));

    const diag = await getRecoveryDiagnostics(journeyManager, 'corrupted-journey');

    expect(diag.exists).toBe(true);
    expect(diag.isRecoverable).toBe(false);
    expect(diag.checksumValid).toBe(false);
    expect(diag.status).toBe('invalid');
    expect(diag.validationError).toBeDefined();
  });

  it('detects expired checkpoint and countdown', async () => {
    await cpManager.save(
      'expired-journey',
      { draft: 'hello' },
      { version: 1 },
      { expiry: -1000 } // expired in past
    );

    const diag = await recoveryManager.getDiagnostics('expired-journey');

    expect(diag.exists).toBe(true);
    expect(diag.isExpired).toBe(true);
    expect(diag.timeUntilExpiryMs).toBe(0);
    expect(diag.isRecoverable).toBe(false);
    expect(diag.status).toBe('expired');
  });

  it('detects schema migration eligibility', async () => {
    // Checkpoint saved under version 1
    await cpManager.save('migratable', { name: 'Bob' }, { version: 1 });

    // App registers version 2 with a migration function
    journeyManager.registerJourney('migratable', {
      version: 2,
      migrate: (oldData: any) => ({ fullName: oldData.name }),
    });

    const diag = await recoveryManager.getDiagnostics('migratable');

    expect(diag.schemaVersion).toBe(1);
    expect(diag.targetSchemaVersion).toBe(2);
    expect(diag.isEligibleForMigration).toBe(true);
  });
});

