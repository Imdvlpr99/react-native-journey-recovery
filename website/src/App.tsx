import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { findPage } from './content/docs';
import { DocsView } from './components/DocsView';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Landing } from './components/Landing';
import { SearchDialog } from './components/SearchDialog';
import { docsHref, interceptLinkClick, navigate, useRoute } from './lib/router';
import { applyHeadMeta } from './lib/head';
import { docsMeta, HOME_META, NOT_FOUND_META, PLAYGROUND_META } from './lib/seo';
import { useTheme } from './lib/theme';

// react-native-web is only needed by the playground, so keep it out of the main bundle.
const Playground = lazy(() => import('./demo/Playground'));

const PlaygroundFallback: React.FC = () => (
  <main id="main" className="flex flex-1 items-center justify-center py-32 text-sm text-fg-muted" aria-busy="true">
    Loading the playground…
  </main>
);

export const App: React.FC = () => {
  const route = useRoute();
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  // Internal <a href="/docs/…"> links navigate client-side instead of reloading.
  useEffect(() => {
    document.addEventListener('click', interceptLinkClick);
    return () => document.removeEventListener('click', interceptLinkClick);
  }, []);

  // Keep title, description and canonical URL in sync with the route.
  const docsPageId = route.view === 'docs' ? route.pageId ?? 'overview' : null;
  useEffect(() => {
    if (route.view === 'home') applyHeadMeta(HOME_META);
    else if (route.view === 'demo') applyHeadMeta(PLAYGROUND_META);
    else applyHeadMeta(docsMeta(docsPageId ?? 'overview') ?? NOT_FOUND_META, { noindex: !docsMeta(docsPageId ?? '') });
  }, [route.view, docsPageId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((open) => !open);
      } else if (e.key === '/' && !searchOpen) {
        const target = e.target as HTMLElement;
        if (target.closest('input, textarea, [contenteditable="true"]')) return;
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen]);

  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const selectResult = useCallback((pageId: string) => {
    setSearchOpen(false);
    navigate(docsHref(pageId));
  }, []);

  const page = route.view === 'docs' ? findPage(route.pageId ?? 'overview') : undefined;
  const section =
    route.view === 'home' ? 'home' : route.view === 'demo' ? 'demo' : page?.group === 'API reference' ? 'api' : 'guide';

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById('main');
          main?.setAttribute('tabindex', '-1');
          main?.focus();
        }}
        className="sr-only z-[60] rounded-md bg-fg px-4 py-2 text-sm font-medium text-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Skip to content
      </a>

      <Header section={section} theme={theme} onToggleTheme={toggle} onOpenSearch={() => setSearchOpen(true)} />

      {route.view === 'home' && <Landing />}
      {route.view === 'docs' && <DocsView pageId={route.pageId} heading={route.heading} />}
      {route.view === 'demo' && (
        <Suspense fallback={<PlaygroundFallback />}>
          <Playground />
        </Suspense>
      )}

      <Footer />

      <SearchDialog open={searchOpen} onClose={closeSearch} onSelect={selectResult} />
    </div>
  );
};
