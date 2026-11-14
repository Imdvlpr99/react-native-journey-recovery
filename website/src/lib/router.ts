import { useEffect, useState } from 'react';

/**
 * Path routes (relative to the deploy base, usually '/'):
 *   /                        home
 *   /docs                    first docs page
 *   /docs/<page>             docs page
 *   /docs/<page>#<heading>   docs page scrolled to a heading
 *   /playground              live React Native demo
 *
 * The site used hash routes (#/docs/<page>) before. Those links still work: they are parsed
 * with parseHash and replaced with the equivalent path on load.
 */
export type Route =
  | { view: 'home' }
  | { view: 'demo' }
  | { view: 'docs'; pageId: string | null; heading: string | null };

/** Deploy base with a trailing slash, e.g. '/' on Vercel or '/react-native-journey-recovery/' on GitHub Pages. */
const BASE: string = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

/** Old section ids from the previous site, kept so shared links still land somewhere useful. */
const LEGACY_ALIASES: Record<string, string> = {
  architecture: 'architecture',
  'architecture-diagram': 'architecture',
  storage: 'storage-adapters',
  'storage-mmkv': 'storage-adapters',
  'storage-secure': 'storage-adapters',
  'storage-async': 'storage-adapters',
  'real-world-guide': 'quickstart',
  'common-patterns': 'overview',
  'api-reference': 'recovery-provider',
  'testing-utilities': 'testing',
};

export function resolveAlias(id: string): string {
  return LEGACY_ALIASES[id] ?? id;
}

function parseSegments(segments: string[], heading: string | null): Route {
  if (segments.length === 0 || segments[0] === 'home' || segments[0] === 'index.html') return { view: 'home' };
  if (segments[0] === 'playground' || segments[0] === 'demo') return { view: 'demo' };
  if (segments[0] === 'docs') {
    const page = segments[1] ? resolveAlias(segments[1]) : null;
    return { view: 'docs', pageId: page, heading };
  }
  // Bare legacy routes such as /architecture or #/storage.
  return { view: 'docs', pageId: resolveAlias(segments[0]), heading };
}

/** Parses a legacy hash route such as '#/docs/quickstart#restore'. */
export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '').trim();
  const [path, heading = null] = raw.split('#');
  return parseSegments(path.split('/').filter(Boolean), heading || null);
}

/** True for the old '#/…' routes; a plain '#heading' is not one. */
export function isLegacyHash(hash: string): boolean {
  return hash.startsWith('#/');
}

/** Parses a pathname (including the deploy base) and its '#heading' fragment. */
export function parsePath(pathname: string, hash = ''): Route {
  let path = pathname;
  if (path.startsWith(BASE)) path = path.slice(BASE.length);
  else if (`${path}/` === BASE) path = '';
  const segments = path
    .replace(/\.html$/, '')
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent);
  const heading = hash.replace(/^#/, '') || null;
  return parseSegments(segments, heading);
}

export function parseLocation(loc: Pick<Location, 'pathname' | 'hash'>): Route {
  return isLegacyHash(loc.hash) ? parseHash(loc.hash) : parsePath(loc.pathname, loc.hash);
}

export function routeHref(route: Route): string {
  if (route.view === 'home') return BASE;
  if (route.view === 'demo') return `${BASE}playground`;
  if (!route.pageId) return `${BASE}docs`;
  return docsHref(route.pageId, route.heading ?? undefined);
}

export const homeHref = (): string => BASE;
export const playgroundHref = (): string => `${BASE}playground`;

export function docsHref(pageId: string, heading?: string): string {
  return heading ? `${BASE}docs/${pageId}#${heading}` : `${BASE}docs/${pageId}`;
}

/** Fired after pushState/replaceState so useRoute picks up programmatic navigation. */
const ROUTE_EVENT = 'routechange';

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseLocation(window.location));

  useEffect(() => {
    // Rewrite old '#/…' links to their path equivalent so the address bar shows the canonical URL.
    if (isLegacyHash(window.location.hash)) {
      history.replaceState(null, '', routeHref(parseHash(window.location.hash)));
    }
    const onChange = () => setRoute(parseLocation(window.location));
    window.addEventListener('popstate', onChange);
    window.addEventListener('hashchange', onChange);
    window.addEventListener(ROUTE_EVENT, onChange);
    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener(ROUTE_EVENT, onChange);
    };
  }, []);

  return route;
}

export function navigate(href: string, options: { replace?: boolean } = {}): void {
  const current = window.location.pathname + window.location.search + window.location.hash;
  if (href !== current) {
    if (options.replace) history.replaceState(null, '', href);
    else history.pushState(null, '', href);
  }
  // Notify even for the same route so the view can react (e.g. scroll to top).
  window.dispatchEvent(new Event(ROUTE_EVENT));
}

/**
 * Click handler for the app root: turns clicks on internal links into client-side
 * navigation so plain <a href="/docs/…"> elements work without a Link component.
 */
export function interceptLinkClick(e: MouseEvent): void {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const anchor = (e.target as Element | null)?.closest?.('a');
  if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#')) return;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin || !(url.pathname + '/').startsWith(BASE)) return;
  e.preventDefault();
  navigate(url.pathname + url.search + url.hash);
}
