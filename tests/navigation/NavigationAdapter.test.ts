import { describe, it, expect, vi } from 'vitest';
import {
  createNavigationAdapter,
  NavigationContext,
  ReactNavigationLike,
} from '../../src/navigation/NavigationAdapter';

describe('React Navigation Adapter', () => {
  it('extracts current route and parameters from navigation state', () => {
    const mockNavigation: ReactNavigationLike = {
      getCurrentRoute: vi.fn().mockReturnValue({
        name: 'ShippingAddressScreen',
        params: { step: 2, orderId: 'ord_99' },
      }),
      getState: vi.fn().mockReturnValue({
        routes: [
          { name: 'CartScreen' },
          { name: 'ShippingAddressScreen', params: { step: 2, orderId: 'ord_99' } },
        ],
        index: 1,
      }),
      navigate: vi.fn(),
    };

    const adapter = createNavigationAdapter(mockNavigation);
    const navContext = adapter.getNavigationContext();

    expect(navContext).toEqual({
      currentRoute: 'ShippingAddressScreen',
      params: { step: 2, orderId: 'ord_99' },
      routeHistory: ['CartScreen', 'ShippingAddressScreen'],
    });
  });

  it('navigates back to the checkpointed route upon restoration', () => {
    const mockNavigation: ReactNavigationLike = {
      getCurrentRoute: vi.fn(),
      getState: vi.fn(),
      navigate: vi.fn(),
      reset: vi.fn(),
    };

    const adapter = createNavigationAdapter(mockNavigation);
    const savedContext: NavigationContext = {
      currentRoute: 'PaymentScreen',
      params: { total: 150 },
    };

    adapter.restoreNavigation(savedContext);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('PaymentScreen', { total: 150 });
  });

  it('resets navigation stack if reset option is specified', () => {
    const mockNavigation: ReactNavigationLike = {
      getCurrentRoute: vi.fn(),
      getState: vi.fn(),
      navigate: vi.fn(),
      reset: vi.fn(),
    };

    const adapter = createNavigationAdapter(mockNavigation);
    const savedContext: NavigationContext = {
      currentRoute: 'PaymentScreen',
      routeHistory: ['CartScreen', 'ShippingScreen', 'PaymentScreen'],
    };

    adapter.restoreNavigation(savedContext, { resetStack: true });

    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 2,
      routes: [
        { name: 'CartScreen' },
        { name: 'ShippingScreen' },
        { name: 'PaymentScreen' },
      ],
    });
  });

  it('handles navigation state when getCurrentRoute returns undefined', () => {
    const mockNavigation: ReactNavigationLike = {
      getCurrentRoute: vi.fn().mockReturnValue(undefined),
      getState: vi.fn().mockReturnValue(undefined),
      navigate: vi.fn(),
    };

    const adapter = createNavigationAdapter(mockNavigation);
    const navContext = adapter.getNavigationContext();

    expect(navContext).toBeNull();
  });
});

