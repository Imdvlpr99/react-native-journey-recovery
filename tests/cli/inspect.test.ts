import { describe, it, expect } from 'vitest';
import { inspectSnapshot, formatReport } from '../../src/cli/inspect';
import { computeChecksum } from '../../src/utils/checksum';

describe('CLI Diagnostic & Inspection Tool', () => {
  it('correctly inspects and validates a healthy checkpoint snapshot', () => {
    const data = { step: 'payment', amount: 99.5 };
    const serializedData = JSON.stringify(data);
    const checksum = computeChecksum(serializedData);

    const snapshot = {
      _formatVersion: 1,
      id: 'checkout-journey',
      version: 2,
      createdAt: Date.now() - 50000,
      updatedAt: Date.now() - 10000,
      expiresAt: Date.now() + 86400000,
      status: 'active',
      checksum,
      data,
    };

    const report = inspectSnapshot(JSON.stringify(snapshot));

    expect(report.valid).toBe(true);
    expect(report.journeyId).toBe('checkout-journey');
    expect(report.version).toBe(2);
    expect(report.checksum.matches).toBe(true);
    expect(report.isExpired).toBe(false);
    expect(report.rejectionReason).toBeUndefined();

    const formatted = formatReport(report);
    expect(formatted).toContain('=== Journey Recovery Checkpoint Inspection ===');
    expect(formatted).toContain('✅ ELIGIBLE');
    expect(formatted).toContain('checkout-journey');
  });

  it('detects corrupted or tampered snapshots when checksum does not match', () => {
    const data = { step: 'payment', amount: 99.5 };
    const fakeChecksum = 'badbeef1';

    const snapshot = {
      id: 'checkout-journey',
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      checksum: fakeChecksum,
      data,
    };

    const report = inspectSnapshot(JSON.stringify(snapshot));

    expect(report.valid).toBe(false);
    expect(report.checksum.matches).toBe(false);
    expect(report.rejectionReason).toContain('Checksum mismatch');

    const formatted = formatReport(report);
    expect(formatted).toContain('❌ REJECTED');
  });

  it('detects expired snapshots correctly', () => {
    const data = { step: 'expired-flow' };
    const checksum = computeChecksum(JSON.stringify(data));

    const snapshot = {
      id: 'expired-journey',
      version: 1,
      createdAt: Date.now() - 200000,
      updatedAt: Date.now() - 100000,
      expiresAt: Date.now() - 50000, // Expired in the past
      checksum,
      data,
    };

    const report = inspectSnapshot(JSON.stringify(snapshot));

    expect(report.valid).toBe(false);
    expect(report.isExpired).toBe(true);
    expect(report.rejectionReason).toContain('Snapshot expired');
  });

  it('handles invalid JSON strings gracefully without throwing', () => {
    const report = inspectSnapshot('NOT_VALID_JSON{');

    expect(report.valid).toBe(false);
    expect(report.status).toBe('corrupted');
    expect(report.rejectionReason).toContain('JSON parse error');
  });
});

