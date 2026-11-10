import { RecoveryEvent, RecoveryStatus } from '../types/recovery';
import { JourneyManager } from './JourneyManager';

export type RecoveryEventListener = (event: RecoveryEvent<any>) => void;

export class LifecycleManager {
  private listeners = new Set<RecoveryEventListener>();

  constructor(private journeyManager?: JourneyManager) {}

  /**
   * Subscribes to recovery lifecycle events.
   * Returns an unsubscribe callback.
   */
  subscribe(listener: RecoveryEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Alias for subscribe to support EventEmitter-like .on() syntax.
   */
  on(status: RecoveryStatus | 'all', listener: RecoveryEventListener): () => void {
    return this.subscribe((event) => {
      if (
        status === 'all' ||
        event.status === status ||
        (status === 'discarded' && event.status === 'idle') ||
        (status === 'idle' && event.status === 'discarded')
      ) {
        listener(event);
      }
    });
  }

  /**
   * Emits a recovery lifecycle event to all subscribed listeners.
   */
  emit(event: RecoveryEvent<any>): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        // Prevent subscriber errors from breaking the engine
        console.error('Error in recovery event subscriber:', err);
      }
    }
  }

  /**
   * Flushes pending debounced auto-saves, e.g. when app changes lifecycle state.
   */
  async flush(journeyId?: string): Promise<void> {
    await this.journeyManager?.flushPending(journeyId);
  }
}

