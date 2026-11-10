import { describe, it, expect } from 'vitest';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { JourneyManager } from '../../src/core/JourneyManager';
import { RecoveryManager } from '../../src/core/RecoveryManager';

describe('Integration: Corrupted Storage Handling', () => {
  it('handles truncated or malformed JSON without crashing and flags as invalid', async () => {
    const storage = new MemoryStorageAdapter();

    // Directly write malformed JSON to simulate corrupted disk state
    await storage.setItem('@rn_journey:booking', '{"id":"booking","version":1,"data":{');

    const cpManager = new CheckpointManager(storage);
    const journeyManager = new JourneyManager(cpManager);
    const recoveryManager = new RecoveryManager(journeyManager);

    const inspection = await recoveryManager.check('booking');
    expect(inspection.available).toBe(false);
    expect(inspection.status).toBe('invalid');
    expect(inspection.error?.code).toBe('SNAPSHOT_CORRUPTED');
  });

  it('handles tampered checksums safely', async () => {
    const storage = new MemoryStorageAdapter();
    const cpManager = new CheckpointManager(storage);

    await cpManager.save('booking', { seats: ['A1', 'A2'] }, { version: 1 });

    // Tamper the stored string by changing the payload while leaving original checksum
    const raw = (await storage.getItem('@rn_journey:booking'))!;
    const parsed = JSON.parse(raw);
    parsed.data.seats = ['VIP_TAMPERED'];
    await storage.setItem('@rn_journey:booking', JSON.stringify(parsed));

    const journeyManager = new JourneyManager(cpManager);
    const recoveryManager = new RecoveryManager(journeyManager);

    const inspection = await recoveryManager.check('booking');
    expect(inspection.available).toBe(false);
    expect(inspection.status).toBe('invalid');
    expect(inspection.error?.code).toBe('SNAPSHOT_CORRUPTED');
  });
});

