import React, { useEffect, useRef } from 'react';
import { DOC_GROUPS } from '../content/docs';
import { docsHref } from '../lib/router';
import { CloseIcon } from './Icons';

const NavList: React.FC<{ activeId: string; onNavigate?: () => void; touch?: boolean }> = ({
  activeId,
  onNavigate,
  touch,
}) => (
  <nav aria-label="Documentation">
    {DOC_GROUPS.map((group) => (
      <div key={group.title} className="mb-6">
        <h2 className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">{group.title}</h2>
        <ul>
          {group.pages.map((page) => {
            const active = page.id === activeId;
            return (
              <li key={page.id}>
                <a
                  href={docsHref(page.id)}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={`relative block rounded-md px-3 text-[0.9rem] transition-colors ${
                    touch ? 'py-2.5' : 'py-1.5'
                  } ${page.code ? 'font-mono text-[0.8125rem]' : ''} ${
                    active
                      ? 'bg-accent-soft font-medium text-fg before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-accent'
                      : 'text-fg-muted hover:bg-hover hover:text-fg'
                  }`}
                >
                  {page.navTitle ?? page.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </nav>
);

export const Sidebar: React.FC<{ activeId: string }> = ({ activeId }) => (
  <aside className="scroll-thin sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto py-8 pr-4 lg:block">
    <NavList activeId={activeId} />
  </aside>
);

interface DrawerProps {
  activeId: string;
  open: boolean;
  onClose: () => void;
}

/** Mobile navigation drawer: modal, Esc to close, focus moves in and returns on close. */
export const SidebarDrawer: React.FC<DrawerProps> = ({ activeId, open, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>('a[href], button');
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="anim-fade absolute inset-0 bg-black/55" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Documentation navigation"
        className="absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col border-r border-line bg-bg shadow-[var(--shadow)]"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-5 pr-2">
          <span className="text-sm font-semibold text-fg">Documentation</span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-fg-muted hover:bg-hover hover:text-fg"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-2 py-6">
          <NavList activeId={activeId} onNavigate={onClose} touch />
        </div>
      </div>
    </div>
  );
};
