import { JourneySnapshot } from '../types/checkpoint';
import { JourneyRecoveryError } from '../utils/errors';
import { computeChecksum } from '../utils/checksum';

export interface SnapshotSerializerOptions {
  /**
   * Maximum allowed snapshot size in bytes. Prevents massive state bloat.
   * Default: 512 KB (524,288 bytes)
   */
  maxSizeBytes?: number;

  /**
   * Internal storage format version.
   * Default: 1
   */
  formatVersion?: number;
}

/**
 * Removes excluded fields. Each entry is a top-level key (`'password'`) or a dot path
 * (`'payment.card.number'`). Arrays are transparent: a path applies to every element,
 * so `'cards.cvv'` removes `cvv` from each item of `cards`.
 */
function omitPaths(value: unknown, paths: string[][]): unknown {
  if (paths.length === 0 || typeof value !== 'object' || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => omitPaths(item, paths));
  }
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    const matching = paths.filter((p) => p[0] === key);
    if (matching.some((p) => p.length === 1)) {
      continue;
    }
    const nested = matching.map((p) => p.slice(1));
    result[key] = nested.length > 0 ? omitPaths(child, nested) : child;
  }
  return result;
}

export class SnapshotSerializer {
  private maxSizeBytes: number;
  private formatVersion: number;

  constructor(options?: SnapshotSerializerOptions) {
    this.maxSizeBytes = options?.maxSizeBytes ?? 512 * 1024;
    this.formatVersion = options?.formatVersion ?? 1;
  }

  /**
   * Serializes a snapshot into a JSON string, calculating checksum and applying exclusions.
   */
  serialize<T>(
    snapshot: JourneySnapshot<T>,
    options?: { exclude?: string[] }
  ): string {
    try {
      let dataToPersist = snapshot.data;
      if (options?.exclude && options.exclude.length > 0) {
        dataToPersist = omitPaths(
          snapshot.data,
          options.exclude.map((path) => path.split('.'))
        ) as T;
      }

      const dataString = JSON.stringify(dataToPersist);
      const checksum = computeChecksum(dataString);

      const completeSnapshot: JourneySnapshot<T> & { _formatVersion?: number } = {
        ...snapshot,
        data: dataToPersist,
        checksum,
        _formatVersion: this.formatVersion,
      };

      const serialized = JSON.stringify(completeSnapshot);

      const byteLength =
        typeof Buffer !== 'undefined'
          ? Buffer.byteLength(serialized, 'utf8')
          : typeof TextEncoder !== 'undefined'
            ? new TextEncoder().encode(serialized).length
            : serialized.length;

      if (byteLength > this.maxSizeBytes) {
        throw new JourneyRecoveryError(
          'SERIALIZATION_FAILED',
          `Snapshot size (${byteLength} bytes) exceeds maximum allowed limit (${this.maxSizeBytes} bytes)`,
          snapshot.id
        );
      }

      return serialized;
    } catch (error) {
      if (error instanceof JourneyRecoveryError) {
        throw error;
      }
      throw new JourneyRecoveryError(
        'SERIALIZATION_FAILED',
        `Failed to serialize journey snapshot: ${error instanceof Error ? error.message : String(error)}`,
        snapshot.id,
        error
      );
    }
  }

  /**
   * Deserializes raw JSON string back into a JourneySnapshot, verifying its checksum.
   */
  deserialize<T>(raw: string): JourneySnapshot<T> {
    if (!raw || typeof raw !== 'string') {
      throw new JourneyRecoveryError(
        'SNAPSHOT_CORRUPTED',
        'Raw snapshot data is empty or invalid string'
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new JourneyRecoveryError(
        'SNAPSHOT_CORRUPTED',
        `Failed to parse snapshot JSON: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error
      );
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new JourneyRecoveryError(
        'SNAPSHOT_CORRUPTED',
        'Snapshot payload root must be an object'
      );
    }

    const snapshot = parsed as JourneySnapshot<T> & { checksum?: string };

    // Verify checksum when present — catches storage corruption
    if (snapshot.checksum !== undefined) {
      const dataString = JSON.stringify(snapshot.data);
      const expected = computeChecksum(dataString);
      if (snapshot.checksum !== expected) {
        throw new JourneyRecoveryError(
          'SNAPSHOT_CORRUPTED',
          `Checksum mismatch for journey "${snapshot.id ?? 'unknown'}": stored ${snapshot.checksum}, computed ${expected}`,
          snapshot.id
        );
      }
    }

    return snapshot;
  }
}
