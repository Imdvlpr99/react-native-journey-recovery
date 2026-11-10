import { computeChecksum } from '../utils/checksum';
import { JourneySnapshot } from '../types/checkpoint';

export interface InspectionReport {
  valid: boolean;
  journeyId: string;
  version: number;
  formatVersion?: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  isExpired: boolean;
  checksum: {
    stored: string;
    computed: string;
    matches: boolean;
  };
  byteSize: number;
  status: string;
  data: unknown;
  rejectionReason?: string;
}

function getByteLength(str: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).length;
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.byteLength(str, 'utf8');
  }
  return str.length;
}

/**
 * Inspects a journey snapshot string or object and generates a diagnostics report.
 */
export function inspectSnapshot(rawInput: string | Record<string, unknown>): InspectionReport {
  let parsed: any;
  let byteSize = 0;

  if (typeof rawInput === 'string') {
    byteSize = getByteLength(rawInput);
    try {
      parsed = JSON.parse(rawInput);
    } catch (e: any) {
      return {
        valid: false,
        journeyId: 'unknown',
        version: 0,
        createdAt: 'invalid',
        updatedAt: 'invalid',
        expiresAt: null,
        isExpired: false,
        checksum: { stored: '', computed: '', matches: false },
        byteSize,
        status: 'corrupted',
        data: null,
        rejectionReason: `JSON parse error: ${e.message}`,
      };
    }
  } else {
    parsed = rawInput;
    byteSize = getByteLength(JSON.stringify(rawInput));
  }

  const journeyId = parsed.id || parsed.journeyId || 'unknown';
  const version = parsed.version ?? 0;
  const formatVersion = parsed._formatVersion;
  const createdAt = parsed.createdAt ? new Date(parsed.createdAt).toISOString() : 'unknown';
  const updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt).toISOString() : 'unknown';
  const expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt).toISOString() : null;

  const now = Date.now();
  const isExpired = Boolean(parsed.expiresAt && parsed.expiresAt < now);

  const storedChecksum = parsed.checksum || '';
  const serializedData = typeof parsed.data === 'string' ? parsed.data : JSON.stringify(parsed.data);
  const computedChecksum = computeChecksum(serializedData);
  const checksumMatches = storedChecksum === computedChecksum;

  let valid = true;
  let rejectionReason: string | undefined;

  if (isExpired) {
    valid = false;
    rejectionReason = `Snapshot expired on ${expiresAt}`;
  } else if (storedChecksum && !checksumMatches) {
    valid = false;
    rejectionReason = `Checksum mismatch! Stored "${storedChecksum}", computed "${computedChecksum}"`;
  } else if (!parsed.data) {
    valid = false;
    rejectionReason = 'Snapshot data payload is missing or empty';
  }

  return {
    valid,
    journeyId,
    version,
    formatVersion,
    createdAt,
    updatedAt,
    expiresAt,
    isExpired,
    checksum: {
      stored: storedChecksum,
      computed: computedChecksum,
      matches: checksumMatches,
    },
    byteSize,
    status: parsed.status || (valid ? 'active' : 'invalid'),
    data: parsed.data,
    rejectionReason,
  };
}

/**
 * Formats an InspectionReport for readable terminal output.
 */
export function formatReport(report: InspectionReport): string {
  const lines: string[] = [];
  lines.push('=== Journey Recovery Checkpoint Inspection ===');
  lines.push(`Journey ID:      ${report.journeyId}`);
  lines.push(`Status:          ${report.valid ? '✅ ELIGIBLE' : '❌ REJECTED'}`);
  if (report.rejectionReason) {
    lines.push(`Reason:          ${report.rejectionReason}`);
  }
  lines.push(`Schema Version:  ${report.version}`);
  if (report.formatVersion) {
    lines.push(`Format Version:  ${report.formatVersion}`);
  }
  lines.push(`Byte Size:       ${report.byteSize.toLocaleString()} bytes`);
  lines.push(`Created At:      ${report.createdAt}`);
  lines.push(`Updated At:      ${report.updatedAt}`);
  lines.push(`Expires At:      ${report.expiresAt ?? 'Never'}`);
  lines.push(`Checksum:        ${report.checksum.matches ? '✅ Valid' : '❌ Mismatch'} (${report.checksum.computed})`);
  lines.push('----------------------------------------------');
  lines.push('Data Payload:');
  lines.push(JSON.stringify(report.data, null, 2));
  lines.push('==============================================');
  return lines.join('\n');
}

