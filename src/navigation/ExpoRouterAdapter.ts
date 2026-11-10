export interface ExpoRouteContext {
  pathname: string;
  segments?: string[];
  params?: Record<string, unknown>;
}

export interface ExpoRouterLike {
  replace: (target: string | { pathname: string; params?: Record<string, unknown> }) => void;
  push: (target: string | { pathname: string; params?: Record<string, unknown> }) => void;
}

export interface RestoreExpoRouteOptions {
  /**
   * Navigation method to use when restoring route: 'replace' (default) or 'push'.
   */
  mode?: 'replace' | 'push';
}

export interface ExpoRouterAdapter {
  getRouteContext(): ExpoRouteContext | null;
  restoreRoute(context: ExpoRouteContext, options?: RestoreExpoRouteOptions): void;
}

/**
 * Creates an adapter for Expo Router's file-based routing architecture.
 */
export function createExpoRouterAdapter(
  router: ExpoRouterLike,
  getContext: () => ExpoRouteContext | null | undefined
): ExpoRouterAdapter {
  return {
    getRouteContext(): ExpoRouteContext | null {
      const ctx = getContext();
      if (!ctx || !ctx.pathname) {
        return null;
      }
      return ctx;
    },

    restoreRoute(context: ExpoRouteContext, options?: RestoreExpoRouteOptions): void {
      const mode = options?.mode ?? 'replace';
      const target = {
        pathname: context.pathname,
        params: context.params,
      };

      if (mode === 'push') {
        router.push(target);
      } else {
        router.replace(target);
      }
    },
  };
}

