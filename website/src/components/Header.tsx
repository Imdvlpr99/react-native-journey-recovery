import React from 'react';
import { docsHref, homeHref, playgroundHref } from '../lib/router';
import { LINKS, VERSION } from '../lib/site';
import type { Theme } from '../lib/theme';
import { GithubIcon, MoonIcon, SearchIcon, SunIcon } from './Icons';
import { LogoMark } from './Logo';

interface HeaderProps {
  section: 'home' | 'guide' | 'api' | 'demo';
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

const NAV = [
  { label: 'Docs', href: docsHref('overview'), key: 'guide' as const },
  { label: 'API', href: docsHref('recovery-provider'), key: 'api' as const },
  { label: 'Playground', href: playgroundHref(), key: 'demo' as const },
];

export const Header: React.FC<HeaderProps> = ({ section, theme, onToggleTheme, onOpenSearch }) => (
  <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75">
    <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-1 px-3 sm:gap-3 sm:px-6 lg:px-8">
      <a href={homeHref()} className="flex shrink-0 items-center gap-2.5 rounded-md text-fg" aria-label="Journey Recovery home">
        <LogoMark />
        <span className="hidden font-mono text-[0.875rem] font-medium tracking-tight sm:inline">
          journey-recovery
        </span>
        <span className="hidden rounded-full border border-line px-2 py-px font-mono text-[0.6875rem] text-fg-muted sm:inline">
          v{VERSION}
        </span>
      </a>

      <nav aria-label="Main" className="flex items-center sm:ml-4 sm:gap-1">
        {NAV.map((item) => {
          const active = section === item.key;
          return (
            <a
              key={item.label}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`rounded-md px-2 py-1.5 text-sm transition-colors sm:px-2.5 ${
                active ? 'font-medium text-fg' : 'text-fg-muted hover:text-fg'
              } ${item.key === 'api' ? 'hidden min-[420px]:inline' : ''}`}
            >
              {item.label}
            </a>
          );
        })}
        <a
          href={LINKS.examples}
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-md px-2.5 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg md:inline"
        >
          Examples
        </a>
      </nav>

      <div className="ml-auto flex items-center sm:gap-1">
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-line bg-elev px-3 text-sm text-fg-subtle transition-colors hover:border-line-strong hover:text-fg-muted md:flex"
        >
          <SearchIcon size={15} />
          <span>Search docs</span>
          <kbd className="ml-auto rounded border border-line px-1.5 font-mono text-[0.6875rem]">
            {isMac ? '⌘' : 'Ctrl'} K
          </kbd>
        </button>
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search docs"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-hover hover:text-fg md:hidden"
        >
          <SearchIcon size={18} />
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-hover hover:text-fg"
        >
          {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={17} />}
        </button>
        <a
          href={LINKS.github}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub repository"
          className="hidden h-10 w-10 sm:flex items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-hover hover:text-fg"
        >
          <GithubIcon size={18} />
        </a>
      </div>
    </div>
  </header>
);
