import { useRecovery } from './useRecovery';
import { RecoveryStatus } from '../types/recovery';

/**
 * Lightweight hook returning only the current recovery status of a journey.
 */
export function useRecoveryStatus(journeyId: string): RecoveryStatus {
  const { status } = useRecovery(journeyId);
  return status;
}

