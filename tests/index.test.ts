import { describe, it, expect } from 'vitest';
import * as JourneyRecovery from '../src/index';

describe('react-native-journey-recovery exports', () => {
  it('exports all expected core classes and factories', () => {
    expect(JourneyRecovery.VERSION).toBe('0.1.0');
    expect(JourneyRecovery.JourneyManager).toBeDefined();
    expect(JourneyRecovery.JourneyRegistry).toBeDefined();
    expect(JourneyRecovery.CheckpointManager).toBeDefined();
    expect(JourneyRecovery.RecoveryManager).toBeDefined();
    expect(JourneyRecovery.LifecycleManager).toBeDefined();
    expect(JourneyRecovery.SnapshotSerializer).toBeDefined();
    expect(JourneyRecovery.SnapshotValidator).toBeDefined();
  });

  it('exports storage adapters', () => {
    expect(JourneyRecovery.MemoryStorageAdapter).toBeDefined();
    expect(JourneyRecovery.AsyncStorageAdapter).toBeDefined();
  });

  it('exports React components and hooks', () => {
    expect(JourneyRecovery.RecoveryProvider).toBeDefined();
    expect(JourneyRecovery.useJourney).toBeDefined();
    expect(JourneyRecovery.useRecovery).toBeDefined();
    expect(JourneyRecovery.useRecoveryStatus).toBeDefined();
    expect(JourneyRecovery.useRecoveryContext).toBeDefined();
  });

  it('exports error hierarchy and utilities', () => {
    expect(JourneyRecovery.JourneyRecoveryError).toBeDefined();
    expect(JourneyRecovery.computeChecksum).toBeDefined();
    expect(JourneyRecovery.debounce).toBeDefined();
  });
});
