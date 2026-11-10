import { describe, it, expect } from 'vitest';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { JourneyManager } from '../../src/core/JourneyManager';

describe('Integration: High Concurrency Writes', () => {
  it('guarantees sequential order and exact final state under rapid parallel saves', async () => {
    const storage = new MemoryStorageAdapter();
    const cpManager = new CheckpointManager(storage);
    const journeyManager = new JourneyManager(cpManager);

    const journey = journeyManager.registerJourney<{ progress: number }>('uploader', {
      version: 1,
    });

    const executionLog: number[] = [];

    // Launch 25 rapid parallel saves
    const count = 25;
    const promises = Array.from({ length: count }, (_, i) => i + 1).map((idx) => {
      return journey.checkpoint({ progress: idx }).then(() => {
        executionLog.push(idx);
      });
    });

    await Promise.all(promises);

    // Verify all 25 were executed in order
    expect(executionLog.length).toBe(25);
    expect(executionLog).toEqual(Array.from({ length: count }, (_, i) => i + 1));

    // Verify final state in storage matches 25
    const latest = await cpManager.get<{ progress: number }>('uploader');
    expect(latest?.data.progress).toBe(25);
  });
});
