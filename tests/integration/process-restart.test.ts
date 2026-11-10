import { describe, it, expect } from 'vitest';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';
import { CheckpointManager } from '../../src/core/CheckpointManager';
import { JourneyManager } from '../../src/core/JourneyManager';
import { RecoveryManager } from '../../src/core/RecoveryManager';

describe('Integration: Process Restart Simulation', () => {
  it('survives process termination and recovers exact multi-step state on clean launch', async () => {
    // Shared persistent storage (like device disk / AsyncStorage)
    const deviceStorage = new MemoryStorageAdapter();

    // --- APP SESSION 1 ---
    {
      const cpManager1 = new CheckpointManager(deviceStorage);
      const journeyManager1 = new JourneyManager(cpManager1);

      const journey = journeyManager1.registerJourney('loan-application', {
        version: 1,
        expiry: 24 * 60 * 60 * 1000,
      });

      // User completes Step 1: Personal info
      await journey.checkpoint({
        step: 1,
        personal: { fullName: 'Jane Doe', ssnLast4: '4321' },
      });

      // User completes Step 2: Income details
      await journey.checkpoint({
        step: 2,
        personal: { fullName: 'Jane Doe', ssnLast4: '4321' },
        financial: { annualIncome: 120000, employer: 'Tech Corp' },
      });

      // Simulate abrupt process termination: session 1 instances dropped from memory
    }

    // --- APP SESSION 2 (Fresh Launch) ---
    {
      const cpManager2 = new CheckpointManager(deviceStorage);
      const journeyManager2 = new JourneyManager(cpManager2);
      const recoveryManager2 = new RecoveryManager(journeyManager2);

      // Check available recoveries
      const inspection = await recoveryManager2.check<{
        step: number;
        personal: { fullName: string; ssnLast4: string };
        financial: { annualIncome: number; employer: string };
      }>('loan-application');

      expect(inspection.available).toBe(true);
      expect(inspection.status).toBe('available');
      expect(inspection.snapshot?.data.step).toBe(2);

      // User accepts recovery prompt
      const restored = await recoveryManager2.restore<typeof inspection.snapshot.data>(
        'loan-application'
      );

      expect(restored.step).toBe(2);
      expect(restored.personal.fullName).toBe('Jane Doe');
      expect(restored.financial.annualIncome).toBe(120000);
    }
  });
});

