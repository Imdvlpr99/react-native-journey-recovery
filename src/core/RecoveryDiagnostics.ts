import { JourneyManager } from './JourneyManager';
import { SnapshotValidator } from './SnapshotValidator';
import { JourneySnapshot } from '../types/checkpoint';
import { RecoveryStatus } from '../types/recovery';
import { computeChecksum } from '../utils/checksum';

export interface JourneyDiagnostics<T = any> {
  journeyId: string;
  exists: boolean;
  status: RecoveryStatus;
  isRecoverable: boolean;
  formatVersion?: number;
  schemaVersion?: number;
  targetSchemaVersion?: number;
  isEligibleForMigration: boolean;
  createdAt?: number;
  updatedAt?: number;
  expiresAt?: number;
  isExpired: boolean;
  timeUntilExpiryMs?: number;
  payloadSizeBytes: number;
  hasChecksum: boolean;
  checksumValid: boolean;
  validationError?: string;
  snapshot?: JourneySnapshot<T> | null;
}

/**
 * Deep diagnostic inspector for journey checkpoints.
 * Explains exactly why a journey can or cannot be recovered, inspecting payload byte size,
 * checksum integrity, expiry countdown, storage format version, and schema migration eligibility.
 */
export async function getRecoveryDiagnostics<T = any>(
  journeyManager: JourneyManager,
  journeyId: string,
  validator?: SnapshotValidator
): Promise<JourneyDiagnostics<T>> {
  const activeValidator = validator ?? new SnapshotValidator();
  const cpManager = journeyManager.getCheckpointManager();
  const rawString = await cpManager.getRaw(journeyId);

  if (!rawString) {
    return {
      journeyId,
      exists: false,
      status: 'idle',
      isRecoverable: false,
      isExpired: false,
      payloadSizeBytes: 0,
      hasChecksum: false,
      checksumValid: false,
      isEligibleForMigration: false,
      snapshot: null,
    };
  }

  // Calculate byte size reliably across environments
  let payloadSizeBytes = 0;
  if (typeof TextEncoder !== 'undefined') {
    payloadSizeBytes = new TextEncoder().encode(rawString).length;
  } else if (typeof Buffer !== 'undefined') {
    payloadSizeBytes = Buffer.byteLength(rawString, 'utf8');
  } else {
    payloadSizeBytes = rawString.length;
  }

  let parsed: any = null;
  try {
    parsed = JSON.parse(rawString);
  } catch (err) {
    return {
      journeyId,
      exists: true,
      status: 'invalid',
      isRecoverable: false,
      isExpired: false,
      payloadSizeBytes,
      hasChecksum: false,
      checksumValid: false,
      isEligibleForMigration: false,
      validationError: `JSON parse error: ${err instanceof Error ? err.message : String(err)}`,
      snapshot: null,
    };
  }

  const formatVersion = parsed._formatVersion ?? 1;
  const schemaVersion = parsed.version;
  const createdAt = parsed.createdAt;
  const updatedAt = parsed.updatedAt;
  const expiresAt = parsed.expiresAt;
  const hasChecksum = Boolean(parsed.checksum);

  let checksumValid = false;
  if (hasChecksum && parsed.data !== undefined) {
    try {
      checksumValid = computeChecksum(JSON.stringify(parsed.data)) === parsed.checksum;
    } catch {
      checksumValid = false;
    }
  }

  const now = Date.now();
  const isExpired = typeof expiresAt === 'number' && now >= expiresAt;
  const timeUntilExpiryMs =
    typeof expiresAt === 'number' ? Math.max(0, expiresAt - now) : undefined;

  const registeredOptions = journeyManager.getRegistry().get<T>(journeyId);
  const targetSchemaVersion = registeredOptions?.version;
  const isEligibleForMigration = Boolean(
    targetSchemaVersion !== undefined &&
      schemaVersion !== undefined &&
      targetSchemaVersion > schemaVersion &&
      typeof registeredOptions?.migrate === 'function'
  );

  const effectiveTarget = targetSchemaVersion ?? 1;
  const storedVersion = typeof schemaVersion === 'number' ? schemaVersion : 0;
  // Same rule as RecoveryManager.check: custom validation applies to the current schema only.
  const validation = activeValidator.validate<T>(
    parsed,
    storedVersion >= effectiveTarget ? registeredOptions : undefined
  );

  let status: RecoveryStatus = 'available';
  let isRecoverable = true;
  let validationError: string | undefined;

  if (!validation.valid) {
    isRecoverable = false;
    validationError = validation.error?.message;
    if (validation.isExpired) {
      status = 'expired';
    } else {
      status = 'invalid';
    }
  } else if (!checksumValid && hasChecksum) {
    isRecoverable = false;
    status = 'invalid';
    validationError = 'Checksum verification failed (data integrity compromised)';
  } else if (storedVersion > effectiveTarget) {
    isRecoverable = false;
    status = 'invalid';
    validationError = `Saved with schema version ${storedVersion}, newer than the registered version ${effectiveTarget}`;
  } else if (parsed.status === 'completed') {
    isRecoverable = false;
    status = 'completed';
    validationError = 'Journey is marked completed and is not offered for resume';
  }

  return {
    journeyId,
    exists: true,
    status,
    isRecoverable,
    formatVersion,
    schemaVersion,
    targetSchemaVersion,
    isEligibleForMigration,
    createdAt,
    updatedAt,
    expiresAt,
    isExpired,
    timeUntilExpiryMs,
    payloadSizeBytes,
    hasChecksum,
    checksumValid,
    validationError,
    snapshot: validation.snapshot ?? (parsed as JourneySnapshot<T>),
  };
}

