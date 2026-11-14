import React, { useEffect, useRef, useState } from 'react';
import { findPage, FIRST_PAGE_ID, neighbors } from '../content/docs';
import { docsHref } from '../lib/router';
import { LINKS } from '../lib/site';
import { ArrowLeftIcon, ArrowRightIcon, ChevronRightIcon, MenuIcon } from './Icons';
import { OnThisPage } from './OnThisPage';
import { Sidebar, SidebarDrawer } from './Sidebar';

interface DocsViewProps {
  pageId: string | null;
  heading: string | null;
}

export const DocsView: React.FC<DocsViewProps> = ({ pageId, heading }) => {
  const id = pageId ?? FIRST_PAGE_ID;
  const page = findPage(id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Scroll and focus management on page change.
  useEffect(() => {
    if (heading) {
      document.getElementById(heading)?.scrollIntoView({ block: 'start' });
    } else {
      window.scrollTo(0, 0);
    }
    if (!firstRender.current) titleRef.current?.focus({ preventScroll: true });
    firstRender.current = false;
  }, [id, heading]);

  const { prev, next } = neighbors(id);

  return (
    <div className="mx-auto w-full max-w-[90rem] flex-1 px-4 sm:px-6 lg:flex lg:px-8">
      <Sidebar activeId={id} />
      <SidebarDrawer activeId={id} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main id="main" className="min-w-0 flex-1 lg:border-l lg:border-line lg:pl-10 xl:pl-14">
        {/* Mobile bar: open nav + breadcrumb */}
        <div className="sticky top-14 z-30 -mx-4 flex items-center gap-2 border-b border-line bg-bg/90 px-2 backdrop-blur-md sm:-mx-6 sm:px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open documentation navigation"
            aria-expanded={drawerOpen}
            className="flex h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-fg hover:bg-hover"
          >
            <MenuIcon size={18} />
            Menu
          </button>
          {page && (
            <p className="flex min-w-0 items-center gap-1 text-sm text-fg-muted">
              <ChevronRightIcon size={14} className="shrink-0 text-fg-subtle" />
              <span className="truncate">{page.group}</span>
            </p>
          )}
        </div>

        <div className="flex">
          <div className="min-w-0 flex-1 pb-16 pt-8 lg:pt-10">
            {page ? (
              <div key={id} className="anim-page max-w-3xl">
                <header className="mb-8">
                  <p className="mb-2 text-sm font-medium text-accent">{page.group}</p>
                  <h1
                    ref={titleRef}
                    tabIndex={-1}
                    className={`text-[1.875rem] font-semibold leading-tight tracking-tight text-fg outline-none sm:text-4xl ${
                      page.code ? 'font-mono !text-[1.625rem] sm:!text-[2rem]' : ''
                    }`}
                  >
                    {page.title}
                  </h1>
                  <p className="mt-3 text-lg leading-relaxed text-fg-muted">{page.description}</p>
                </header>

                <article ref={articleRef} className="prose-doc">
                  <page.Component />
                </article>

                <nav aria-label="Pagination" className="mt-16 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
                  {prev ? (
                    <a
                      href={docsHref(prev.id)}
                      className="group flex flex-col rounded-lg border border-line px-4 py-3 transition-colors hover:border-line-strong hover:bg-elev"
                    >
                      <span className="flex items-center gap-1 text-xs text-fg-subtle">
                        <ArrowLeftIcon size={13} /> Previous
                      </span>
                      <span className={`mt-1 text-[0.9375rem] font-medium text-fg ${prev.code ? 'font-mono text-sm' : ''}`}>{prev.title}</span>
                    </a>
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                  {next && (
                    <a
                      href={docsHref(next.id)}
                      className="group flex flex-col items-end rounded-lg border border-line px-4 py-3 text-right transition-colors hover:border-line-strong hover:bg-elev"
                    >
                      <span className="flex items-center gap-1 text-xs text-fg-subtle">
                        Next <ArrowRightIcon size={13} />
                      </span>
                      <span className={`mt-1 text-[0.9375rem] font-medium text-fg ${next.code ? 'font-mono text-sm' : ''}`}>{next.title}</span>
                    </a>
                  )}
                </nav>

                <p className="mt-8 text-sm text-fg-subtle">
                  Found a mistake or something unclear?{' '}
                  <a href={LINKS.issues} target="_blank" rel="noreferrer" className="text-fg-muted underline underline-offset-2 hover:text-fg">
                    Open an issue
                  </a>
                  .
                </p>
              </div>
            ) : (
              <div className="max-w-3xl py-16">
                <p className="font-mono text-sm text-accent">404</p>
                <h1 ref={titleRef} tabIndex={-1} className="mt-2 text-3xl font-semibold tracking-tight text-fg outline-none">
                  Page not found
                </h1>
                <p className="mt-3 text-fg-muted">
                  There is no docs page called <code className="font-mono text-fg">{id}</code>. It may have moved.
                </p>
                <a
                  href={docsHref(FIRST_PAGE_ID)}
                  className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-fg px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90"
                >
                  Go to the introduction <ArrowRightIcon size={15} />
                </a>
              </div>
            )}
          </div>

          {page && <OnThisPage pageId={id} articleRef={articleRef} />}
        </div>
      </main>
    </div>
  );
};
