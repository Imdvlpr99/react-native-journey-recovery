import { JourneyOptions } from '../types/journey';
import { JourneyRecoveryError } from '../utils/errors';

export interface RegisterOptions {
  allowDuplicate?: boolean;
}

export class JourneyRegistry {
  private registry = new Map<string, JourneyOptions<any>>();

  /**
   * Registers a named journey configuration.
   */
  register<T>(
    id: string,
    options?: JourneyOptions<T>,
    registerOptions?: RegisterOptions
  ): void {
    if (this.registry.has(id) && !registerOptions?.allowDuplicate) {
      throw new JourneyRecoveryError(
        'JOURNEY_ALREADY_ACTIVE',
        `Journey with ID "${id}" is already registered and active. Pass allowDuplicate: true to overwrite.`,
        id
      );
    }

    this.registry.set(id, options ?? { version: 1 });
  }

  /**
   * Retrieves registered journey options by ID.
   */
  get<T>(id: string): JourneyOptions<T> | undefined {
    return this.registry.get(id);
  }

  /**
   * Checks whether a journey is registered.
   */
  has(id: string): boolean {
    return this.registry.has(id);
  }

  /**
   * Unregisters a journey configuration.
   */
  unregister(id: string): void {
    this.registry.delete(id);
  }

  /**
   * Clears all registered journeys.
   */
  clear(): void {
    this.registry.clear();
  }
}

