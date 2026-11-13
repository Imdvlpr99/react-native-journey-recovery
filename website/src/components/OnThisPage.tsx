import React, { useEffect, useState } from 'react';
import { docsHref } from '../lib/router';

interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface OnThisPageProps {
  pageId: string;
  articleRef: React.RefObject<HTMLElement>;
}

export const OnThisPage: React.FC<OnThisPageProps> = ({ pageId, articleRef }) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Collect headings from the rendered article.
  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;
    const found = Array.from(root.querySelectorAll<HTMLElement>('h2[id], h3[id]')).map((el) => ({
      id: el.id,
      text: el.textContent ?? '',
      level: (el.tagName === 'H2' ? 2 : 3) as 2 | 3,
    }));
    setHeadings(found);
    setActiveId(found[0]?.id ?? null);
  }, [pageId, articleRef]);

  // Scroll-spy: highlight the last heading that has passed the top band.
  useEffect(() => {
    if (headings.length === 0 || typeof IntersectionObserver === 'undefined') return;
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => visible.set(e.target.id, e.isIntersecting));
        const firstVisible = headings.find((h) => visible.get(h.id));
        if (firstVisible) setActiveId(firstVisible.id);
      },
      { rootMargin: '-72px 0px -65% 0px', threshold: 0 }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <aside className="scroll-thin sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 pl-6 xl:block">
      <nav aria-label="On this page">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">On this page</p>
        <ul className="border-l border-line text-[0.8125rem]">
          {headings.map((h) => {
            const active = h.id === activeId;
            return (
              <li key={h.id}>
                <a
                  href={docsHref(pageId, h.id)}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    history.replaceState(null, '', docsHref(pageId, h.id));
                    setActiveId(h.id);
                  }}
                  aria-current={active ? 'location' : undefined}
                  className={`-ml-px block border-l py-1 leading-snug transition-colors ${
                    h.level === 3 ? 'pl-6' : 'pl-3'
                  } ${active ? 'border-accent text-fg' : 'border-transparent text-fg-muted hover:text-fg'}`}
                >
                  {h.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
