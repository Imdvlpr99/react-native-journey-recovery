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
    expect(JourneyRecovery.getRecoveryDiagnostics).toBeDefined();
  });

  it('exports storage adapters including MMKV', () => {
    expect(JourneyRecovery.MemoryStorageAdapter).toBeDefined();
    expect(JourneyRecovery.AsyncStorageAdapter).toBeDefined();
    expect(JourneyRecovery.MMKVStorageAdapter).toBeDefined();
  });

  it('exports form integration', () => {
    expect(JourneyRecovery.useJourneyForm).toBeDefined();
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

  it('exports testing environment utilities', () => {
    expect(JourneyRecovery.createTestRecoveryEnvironment).toBeDefined();
    expect(JourneyRecovery.initTestRecoveryEnvironment).toBeDefined();
  });
});
