import { RecoveryEvent, RecoveryEventType, RecoveryStatus } from '../types/recovery';
import { JourneyManager } from './JourneyManager';

export type RecoveryEventListener = (event: RecoveryEvent<any>) => void;

export class LifecycleManager {
  private listeners = new Set<RecoveryEventListener>();
  private attached = new WeakSet<JourneyManager>();

  constructor(private journeyManager?: JourneyManager) {
    if (journeyManager) this.attach(journeyManager);
  }

  /**
   * Forwards a JourneyManager's events (saves, failures, restores, migrations...) to this
   * manager's listeners. Safe to call more than once.
   */
  attach(journeyManager: JourneyManager): void {
    if (this.attached.has(journeyManager)) return;
    this.attached.add(journeyManager);
    journeyManager.addEventSink((event) => this.emit(event));
  }

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
   * Listens to events with a given status (or 'all').
   */
  on(status: RecoveryStatus | 'all', listener: RecoveryEventListener): () => void {
    return this.subscribe((event) => {
      if (status === 'all' || event.status === status) {
        listener(event);
      }
    });
  }

  /**
   * Listens to events of one or more types, e.g. `onEvent('save_failed', report)`.
   */
  onEvent(type: RecoveryEventType | RecoveryEventType[], listener: RecoveryEventListener): () => void {
    const types = Array.isArray(type) ? type : [type];
    return this.subscribe((event) => {
      if (types.includes(event.type)) {
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
   * Writes pending debounced auto-saves, e.g. when the app goes to the background.
   * Rejects if a write fails (the failure is also emitted as a `save_failed` event).
   */
  async flush(journeyId?: string): Promise<void> {
    await this.journeyManager?.flushPending(journeyId);
  }
}
