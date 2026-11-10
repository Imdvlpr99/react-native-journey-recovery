export interface NavigationContext {
  currentRoute: string;
  params?: Record<string, unknown>;
  routeHistory?: string[];
}

export interface ReactNavigationLike {
  getCurrentRoute?: () => { name: string; params?: Record<string, unknown> } | undefined;
  getState?: () => { routes?: Array<{ name: string; params?: Record<string, unknown> }>; index?: number } | undefined;
  navigate: (name: string, params?: Record<string, unknown>) => void;
  reset?: (state: { index: number; routes: Array<{ name: string; params?: Record<string, unknown> }> }) => void;
}

export interface RestoreNavigationOptions {
  /**
   * Whether to reset the entire stack to the checkpointed route history rather than just navigating forward.
   */
  resetStack?: boolean;
}

export interface NavigationAdapter {
  getNavigationContext(): NavigationContext | null;
  restoreNavigation(context: NavigationContext, options?: RestoreNavigationOptions): void;
}

/**
 * Creates an adapter for React Navigation to capture and restore screen context.
 */
export function createNavigationAdapter(navigation: ReactNavigationLike): NavigationAdapter {
  return {
    getNavigationContext(): NavigationContext | null {
      const currentRoute = typeof navigation.getCurrentRoute === 'function' ? navigation.getCurrentRoute() : undefined;
      if (!currentRoute?.name) {
        return null;
      }

      const state = typeof navigation.getState === 'function' ? navigation.getState() : undefined;
      const routeHistory = state?.routes ? state.routes.map((r) => r.name) : undefined;

      return {
        currentRoute: currentRoute.name,
        params: currentRoute.params,
        routeHistory,
      };
    },

    restoreNavigation(context: NavigationContext, options?: RestoreNavigationOptions): void {
      if (
        options?.resetStack &&
        context.routeHistory &&
        context.routeHistory.length > 0 &&
        typeof navigation.reset === 'function'
      ) {
        const routes = context.routeHistory.map((name) => {
          if (name === context.currentRoute && context.params) {
            return { name, params: context.params };
          }
          return { name };
        });

        navigation.reset({
          index: routes.length - 1,
          routes,
        });
        return;
      }

      navigation.navigate(context.currentRoute, context.params);
    },
  };
}

