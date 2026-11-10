import { describe, it, expect, beforeEach } from 'vitest';
import { JourneyRegistry } from '../../src/core/JourneyRegistry';
import { JourneyRecoveryError } from '../../src/utils/errors';

describe('JourneyRegistry', () => {
  let registry: JourneyRegistry;

  beforeEach(() => {
    registry = new JourneyRegistry();
  });

  it('registers and retrieves a journey configuration', () => {
    registry.register('checkout', { version: 1, expiry: 5000 });
    expect(registry.has('checkout')).toBe(true);
    expect(registry.get('checkout')).toEqual({ version: 1, expiry: 5000 });
  });

  it('throws JOURNEY_ALREADY_ACTIVE if registering duplicate journey without allowDuplicate', () => {
    registry.register('checkout', { version: 1 });
    expect(() => registry.register('checkout', { version: 2 })).toThrow(JourneyRecoveryError);
    try {
      registry.register('checkout', { version: 2 });
    } catch (err) {
      expect((err as JourneyRecoveryError).code).toBe('JOURNEY_ALREADY_ACTIVE');
    }
  });

  it('allows overwrite if duplicate registration explicitly permitted', () => {
    registry.register('checkout', { version: 1 });
    registry.register('checkout', { version: 2 }, { allowDuplicate: true });
    expect(registry.get('checkout')?.version).toBe(2);
  });

  it('unregisters a journey correctly', () => {
    registry.register('checkout', { version: 1 });
    registry.unregister('checkout');
    expect(registry.has('checkout')).toBe(false);
  });
});
