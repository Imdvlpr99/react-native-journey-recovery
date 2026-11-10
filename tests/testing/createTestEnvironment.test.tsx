import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  createTestRecoveryEnvironment,
  initTestRecoveryEnvironment,
} from '../../src/testing/createTestEnvironment';
import { useRecovery } from '../../src/react/useRecovery';

describe('createTestRecoveryEnvironment (Testing Utilities)', () => {
  it('creates an isolated test environment with pre-seeded checkpoints', async () => {
    const env = await initTestRecoveryEnvironment({
      initialCheckpoints: {
        'test-journey': {
          data: { step: 3, user: 'Tester' },
          metadata: { version: 1 },
        },
      },
    });

    const { result } = renderHook(() => useRecovery('test-journey'), {
      wrapper: env.wrapper,
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.available).toBe(true);
    expect(result.current.snapshot?.data).toEqual({ step: 3, user: 'Tester' });

    let restored: any;
    await act(async () => {
      restored = await result.current.restore();
    });

    expect(restored).toEqual({ step: 3, user: 'Tester' });
  });

  it('allows dynamic seedCheckpoint inside unit test assertions', async () => {
    const env = createTestRecoveryEnvironment();

    await env.seedCheckpoint('dynamic-journey', { active: true, amount: 250 });

    const { result } = renderHook(() => useRecovery('dynamic-journey'), {
      wrapper: env.wrapper,
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.available).toBe(true);
    expect(result.current.snapshot?.data).toEqual({ active: true, amount: 250 });
  });
});
