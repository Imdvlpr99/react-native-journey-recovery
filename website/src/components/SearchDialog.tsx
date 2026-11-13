import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ALL_PAGES, DocPage } from '../content/docs';
import { ArrowRightIcon, SearchIcon } from './Icons';

type Result = DocPage & { group: string };

const SUGGESTED = ['quickstart', 'use-journey', 'use-recovery', 'storage-adapters', 'schema-migration', 'errors'];

function score(page: Result, terms: string[]): number {
  const title = page.title.toLowerCase();
  const keywords = page.keywords.join(' ').toLowerCase();
  const description = page.description.toLowerCase();
  let total = 0;
  for (const term of terms) {
    if (title === term) total += 100;
    else if (title.startsWith(term)) total += 40;
    else if (title.includes(term)) total += 25;
    else if (keywords.includes(term)) total += 15;
    else if (description.includes(term)) total += 6;
    else if (page.group.toLowerCase().includes(term)) total += 3;
    else return 0; // every term must match somewhere
  }
  return total;
}

export function searchPages(query: string): Result[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return SUGGESTED.map((id) => ALL_PAGES.find((p) => p.id === id)).filter((p): p is Result => Boolean(p));
  }
  return ALL_PAGES.map((p) => ({ p, s: score(p, terms) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map((r) => r.p);
}

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (pageId: string) => void;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const listId = useId();

  const results = useMemo(() => searchPages(query), [query]);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setQuery('');
    setActive(0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      returnFocusRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const choose = (r: Result | undefined) => {
    if (r) onSelect(r.id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Tab') {
      // Only the input is tabbable; keep focus inside the dialog.
      e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh] sm:pt-[14vh]">
      <div className="anim-fade absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
        onKeyDown={onKeyDown}
        className="anim-pop relative flex max-h-[min(32rem,76vh)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line-strong bg-elev shadow-[var(--shadow)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <SearchIcon size={18} className="shrink-0 text-fg-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            placeholder="Search pages, hooks, options…"
            aria-label="Search documentation"
            autoComplete="off"
            spellCheck={false}
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle [&::-webkit-search-cancel-button]:hidden"
          />
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[0.6875rem] text-fg-subtle hover:text-fg"
          >
            Esc
          </button>
        </div>

        <div className="scroll-thin overflow-y-auto p-2">
          {!query && <p className="px-3 pb-1 pt-2 text-xs font-medium text-fg-subtle">Suggested</p>}
          {results.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-fg-muted">
              No pages match “{query}”. Try a hook name like <code className="font-mono text-fg">useRecovery</code>.
            </p>
          ) : (
            <ul ref={listRef} id={listId} role="listbox" aria-label="Results">
              {results.map((r, i) => (
                <li
                  key={r.id}
                  id={`${listId}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => choose(r)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 ${
                    i === active ? 'bg-hover' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={`truncate text-sm font-medium text-fg ${r.code ? 'font-mono' : ''}`}>{r.title}</span>
                      <span className="shrink-0 text-xs text-fg-subtle">{r.group}</span>
                    </div>
                    <p className="truncate text-[0.8125rem] text-fg-muted">{r.description}</p>
                  </div>
                  <ArrowRightIcon size={15} className={`shrink-0 text-fg-subtle ${i === active ? 'opacity-100' : 'opacity-0'}`} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hidden items-center gap-4 border-t border-line px-4 py-2 text-xs text-fg-subtle sm:flex">
          <span><kbd className="font-mono">↑↓</kbd> to move</span>
          <span><kbd className="font-mono">Enter</kbd> to open</span>
          <span><kbd className="font-mono">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};
