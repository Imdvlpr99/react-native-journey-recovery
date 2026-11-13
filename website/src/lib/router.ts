import { useEffect, useState } from 'react';

/**
 * Hash routes:
 *   #/                       home
 *   #/docs                   first docs page
 *   #/docs/<page>            docs page
 *   #/docs/<page>#<heading>  docs page scrolled to a heading
 *   #/playground             live React Native demo
 */
export type Route =
  | { view: 'home' }
  | { view: 'demo' }
  | { view: 'docs'; pageId: string | null; heading: string | null };

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

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '').trim();
  if (!raw || raw === 'home') return { view: 'home' };
  if (raw === 'playground' || raw === 'demo') return { view: 'demo' };

  const [path, heading = null] = raw.split('#');
  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'docs') {
    const page = segments[1] ? resolveAlias(segments[1]) : null;
    return { view: 'docs', pageId: page, heading };
  }

  // Bare legacy routes such as #/architecture or #/storage.
  return { view: 'docs', pageId: resolveAlias(segments[0]), heading };
}

export function docsHref(pageId: string, heading?: string): string {
  return heading ? `#/docs/${pageId}#${heading}` : `#/docs/${pageId}`;
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

export function navigate(href: string): void {
  if (window.location.hash === href) {
    // Same route: still notify listeners so the view can react (e.g. scroll to top).
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  window.location.hash = href;
}
