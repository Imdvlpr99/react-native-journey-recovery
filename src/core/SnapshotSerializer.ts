import { JourneySnapshot } from '../types/checkpoint';
import { JourneyRecoveryError } from '../utils/errors';
import { computeChecksum } from '../utils/checksum';

function omitFields(obj: unknown, exclude: string[]): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => omitFields(item, exclude));
  }
  const result: Record<string, unknown> = {};
  const excludeSet = new Set(exclude);
  for (const [k, v] of Object.entries(obj)) {
    if (!excludeSet.has(k)) {
      result[k] = v;
    }
  }
  return result;
}

export class SnapshotSerializer {
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
        dataToPersist = omitFields(snapshot.data, options.exclude) as T;
      }

      const dataString = JSON.stringify(dataToPersist);
      const checksum = computeChecksum(dataString);

      const completeSnapshot: JourneySnapshot<T> = {
        ...snapshot,
        data: dataToPersist,
        checksum,
      };

      return JSON.stringify(completeSnapshot);
    } catch (error) {
      throw new JourneyRecoveryError(
        'SERIALIZATION_FAILED',
        `Failed to serialize journey snapshot: ${error instanceof Error ? error.message : String(error)}`,
        snapshot.id,
        error
      );
    }
  }

  /**
   * Deserializes raw JSON string back into a JourneySnapshot.
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

    return parsed as JourneySnapshot<T>;
  }
}

