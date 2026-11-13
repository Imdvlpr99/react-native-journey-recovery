import React, { useState, useEffect } from 'react';
import { IconSearch, IconGithub, IconMenu, IconX } from './Icons';

export type ActiveTab = 'home' | 'docs' | 'architecture' | 'storage';

interface NavbarProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab, sectionId?: string) => void;
  onOpenSearch: () => void;
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  showSidebarToggle?: boolean;
}

const NAV_LINKS = [
  { label: 'Overview', tab: 'home' as ActiveTab, section: undefined },
  { label: 'Docs', tab: 'docs' as ActiveTab, section: undefined },
  { label: 'API Reference', tab: 'docs' as ActiveTab, section: 'api-reference' },
  { label: 'Examples', tab: 'docs' as ActiveTab, section: 'quickstart' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  onOpenSearch,
  onMenuToggle,
  sidebarOpen = false,
  onThemeToggle,
  showSidebarToggle = false,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-200 ${
          scrolled
            ? 'bg-[#090B14]/95 backdrop-blur-xl border-b border-white/[0.07]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-14 flex items-center gap-3 sm:gap-4">
          {/* Mobile sidebar toggle */}
          {showSidebarToggle && onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 -ml-2 rounded-md text-[#F5F7FF]/40 hover:text-[#F5F7FF] transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <IconX size={16} /> : <IconMenu size={16} />}
            </button>
          )}

          {/* Logo */}
          <a
            href="#/"
            onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/10 bg-[#131A28] flex items-center justify-center">
              <img src="./logo.png" alt="" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-sm font-semibold text-[#F5F7FF] tracking-tight group-hover:text-[#22C7F2] transition-colors">
              journey-recovery
            </span>
            <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] font-mono text-[#873DF5] bg-[#873DF5]/10 border border-[#873DF5]/20">
              v0.1.0
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 ml-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.tab === 'home'
                  ? activeTab === 'home'
                  : activeTab === 'docs' && !link.section;
              return (
                <a
                  key={link.label}
                  href={link.tab === 'home' ? '#/' : link.section ? `#/docs/${link.section}` : '#/docs'}
                  onClick={(e) => { e.preventDefault(); onNavigate(link.tab, link.section); }}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'text-[#F5F7FF] font-medium'
                      : 'text-[#F5F7FF]/45 hover:text-[#F5F7FF]/80'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] text-[#F5F7FF]/35 hover:text-[#F5F7FF]/60 text-xs transition-all"
              aria-label="Search (⌘K)"
            >
              <IconSearch size={12} />
              <span>Search…</span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.05] text-[#F5F7FF]/25 border border-white/[0.07]">
                ⌘K
              </kbd>
            </button>
            <button
              type="button"
              onClick={onOpenSearch}
              className="sm:hidden p-2 rounded-md text-[#F5F7FF]/40 hover:text-[#F5F7FF] transition-colors"
            >
              <IconSearch size={16} />
            </button>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={onThemeToggle}
              className="p-2 rounded-md text-[#F5F7FF]/40 hover:text-[#F5F7FF] transition-colors"
              aria-label="Toggle theme"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </button>

            {/* GitHub */}
            <a
              href="https://github.com/Imdvlpr99/react-native-journey-recovery"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-md text-[#F5F7FF]/40 hover:text-[#F5F7FF] transition-colors"
              aria-label="GitHub"
            >
              <IconGithub size={16} />
            </a>

            {/* CTA */}
            <a
              href="#/docs/quickstart"
              onClick={(e) => { e.preventDefault(); onNavigate('docs', 'quickstart'); }}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#22C7F2] hover:bg-[#3ACFEF] text-[#090B14] transition-all shadow-[0_0_20px_rgba(34,199,242,0.25)] hover:shadow-[0_0_28px_rgba(34,199,242,0.35)]"
            >
              Get Started
            </a>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-md text-[#F5F7FF]/40 hover:text-[#F5F7FF] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <IconX size={16} /> : <IconMenu size={16} />}
          </button>
        </div>
      </header>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <div className="fixed top-14 left-0 right-0 z-40 md:hidden bg-[#090B14]/98 backdrop-blur-xl border-b border-white/[0.07] animate-slide-down">
          <nav className="max-w-7xl mx-auto px-5 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.tab === 'home' ? '#/' : link.section ? `#/docs/${link.section}` : '#/docs'}
                onClick={(e) => { e.preventDefault(); onNavigate(link.tab, link.section); setMobileOpen(false); }}
                className="px-3 py-2.5 rounded-lg text-sm text-[#F5F7FF]/65 hover:text-[#F5F7FF] hover:bg-white/[0.04] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-white/[0.07] mt-1">
              <a
                href="#/docs/quickstart"
                onClick={(e) => { e.preventDefault(); onNavigate('docs', 'quickstart'); setMobileOpen(false); }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#22C7F2] text-[#090B14] transition-colors"
              >
                Get Started
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};
