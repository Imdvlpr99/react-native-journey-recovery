import React, { useState, useEffect } from 'react';
import { IconSearch, IconSun, IconMoon, IconGithub, IconMenu, IconX } from './Icons';

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

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  onOpenSearch,
  onMenuToggle,
  sidebarOpen = false,
  theme,
  onThemeToggle,
  showSidebarToggle = false,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) setScrollProgress((totalScroll / windowHeight) * 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 h-14 w-full border-b border-white/8 bg-white/5 backdrop-blur-xl backdrop-saturate-150">
      {/* Scroll progress bar */}
      <div
        className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-violet-500 to-blue-400 transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center gap-2">
        {/* Hamburger – docs mobile only */}
        {showSidebarToggle && onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/8 cursor-pointer transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <IconX size={16} /> : <IconMenu size={16} />}
          </button>
        )}

        {/* Logo */}
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('home');
          }}
          className="flex items-center gap-2 text-sm font-semibold text-white hover:opacity-85 transition-opacity shrink-0"
        >
          <img
            src="./logo.png"
            alt="journey-recovery"
            className="w-6 h-6 rounded-md object-contain"
          />
          <span className="hidden sm:inline">journey-recovery</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-violet-300 bg-violet-500/15 border border-violet-400/25">
            v0.1.0
          </span>
        </a>

        {/* Docs nav link */}
        <a
          href="#/docs"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('docs');
          }}
          className={`hidden sm:block text-sm px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'docs'
              ? 'text-white/90 font-medium'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          Docs
        </a>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search – desktop */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/8 text-white/40 hover:text-white/60 text-xs transition-colors cursor-pointer"
          aria-label="Search (⌘K)"
        >
          <IconSearch size={13} />
          <span>Search…</span>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/8 text-white/30 border border-white/10">
            ⌘K
          </kbd>
        </button>

        {/* Search – mobile */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="sm:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/8 cursor-pointer transition-colors"
          aria-label="Search"
        >
          <IconSearch size={16} />
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={onThemeToggle}
          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
          aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? (
            <IconSun size={16} className="text-amber-300" />
          ) : (
            <IconMoon size={16} className="text-violet-300" />
          )}
        </button>

        {/* GitHub */}
        <a
          href="https://github.com/Imdvlpr99/react-native-journey-recovery"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-colors"
          aria-label="GitHub Repository"
        >
          <IconGithub size={16} />
        </a>
      </div>
    </header>
  );
};
