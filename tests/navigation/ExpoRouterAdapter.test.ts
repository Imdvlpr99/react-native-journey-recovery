import { describe, it, expect, vi } from 'vitest';
import {
  createExpoRouterAdapter,
  ExpoRouterLike,
  ExpoRouteContext,
} from '../../src/navigation/ExpoRouterAdapter';

describe('Expo Router Adapter', () => {
  it('captures route context including pathname, segments, and search params', () => {
    const mockRouter: ExpoRouterLike = {
      replace: vi.fn(),
      push: vi.fn(),
    };

    const currentContext: ExpoRouteContext = {
      pathname: '/checkout/shipping',
      segments: ['checkout', 'shipping'],
      params: { method: 'express' },
    };

    const adapter = createExpoRouterAdapter(mockRouter, () => currentContext);
    const captured = adapter.getRouteContext();

    expect(captured).toEqual({
      pathname: '/checkout/shipping',
      segments: ['checkout', 'shipping'],
      params: { method: 'express' },
    });
  });

  it('restores route using router.replace by default', () => {
    const mockRouter: ExpoRouterLike = {
      replace: vi.fn(),
      push: vi.fn(),
    };

    const adapter = createExpoRouterAdapter(mockRouter, () => null);

    adapter.restoreRoute({
      pathname: '/onboarding/step2',
      params: { plan: 'pro' },
    });

    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/onboarding/step2',
      params: { plan: 'pro' },
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('restores route using router.push when mode is push', () => {
    const mockRouter: ExpoRouterLike = {
      replace: vi.fn(),
      push: vi.fn(),
    };

    const adapter = createExpoRouterAdapter(mockRouter, () => null);

    adapter.restoreRoute(
      {
        pathname: '/booking/seats',
      },
      { mode: 'push' }
    );

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/booking/seats',
      params: undefined,
    });
  });
});

