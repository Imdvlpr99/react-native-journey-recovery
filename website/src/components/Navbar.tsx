import React, { useState, useEffect } from 'react';
import {
  IconSearch, IconSun, IconMoon, IconGithub, IconMenu, IconX,
  IconLayers, IconDatabase
} from './Icons';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress((totalScroll / windowHeight) * 100);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabClick = (tab: ActiveTab) => {
    setMobileMenuOpen(false);
    onNavigate(tab);
  };

  return (
    <header className="sticky top-0 z-50 h-14 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#090b10]/90 backdrop-blur-md transition-colors">
      {/* Top subtle scroll indicator */}
      <div
        className="absolute top-0 left-0 h-[2px] bg-sky-500 transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        {/* Left: Sidebar toggle (docs only) & Brand */}
        <div className="flex items-center gap-3">
          {showSidebarToggle && onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium cursor-pointer"
              aria-label="Toggle documentation sidebar"
              title="Toggle sidebar"
            >
              {sidebarOpen ? <IconX size={15} /> : <IconMenu size={15} />}
              <span>Menu</span>
            </button>
          )}

          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick('home');
            }}
            className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100 font-semibold tracking-tight text-sm hover:opacity-90 transition-opacity"
          >
            <img
              src="./logo.png"
              alt="react-native-journey-recovery"
              className="w-6 h-6 rounded-md object-contain"
            />
            <span className="hidden sm:inline font-bold text-slate-900 dark:text-slate-100">
              journey-recovery
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
              v0.1.0
            </span>
          </a>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-0.5 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => handleTabClick('home')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'home'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('docs')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            Documentation
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('architecture')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <IconLayers size={13} />
            <span>Architecture</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('storage')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'storage'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <IconDatabase size={13} />
            <span>Storage Matrix</span>
          </button>
        </nav>

        {/* Right: Search, Theme Toggle, GitHub */}
        <div className="flex items-center gap-2">
          {/* Spotlight Search Trigger */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-xs transition-colors cursor-pointer"
            aria-label="Search documentation"
            title="Search documentation (⌘K or Ctrl+K)"
          >
            <IconSearch size={13} className="text-slate-400" />
            <span>Search docs...</span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Mobile search icon only */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="sm:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
            aria-label="Search documentation"
          >
            <IconSearch size={17} />
          </button>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={onThemeToggle}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            aria-label={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
            title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
          >
            {theme === 'dark' ? <IconSun size={16} className="text-amber-400" /> : <IconMoon size={16} className="text-slate-700" />}
          </button>

          {/* GitHub Repository Link */}
          <a
            href="https://github.com/Imdvlpr99/react-native-journey-recovery"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            aria-label="GitHub Repository"
            title="GitHub Repository"
          >
            <IconGithub size={17} />
          </a>

          {/* Mobile navigation menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <IconX size={18} /> : <IconMenu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation dropdown drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#090b10]/95 backdrop-blur-sm px-4 py-3 space-y-0.5">
          <button
            type="button"
            onClick={() => handleTabClick('home')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'home'
                ? 'bg-slate-100 text-sky-700 dark:bg-slate-800 dark:text-sky-300 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('docs')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'docs'
                ? 'bg-slate-100 text-sky-700 dark:bg-slate-800 dark:text-sky-300 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            Documentation
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('architecture')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
              activeTab === 'architecture'
                ? 'bg-slate-100 text-sky-700 dark:bg-slate-800 dark:text-sky-300 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <span>Architecture</span>
            <IconLayers size={14} />
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('storage')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
              activeTab === 'storage'
                ? 'bg-slate-100 text-sky-700 dark:bg-slate-800 dark:text-sky-300 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <span>Storage Matrix</span>
            <IconDatabase size={14} />
          </button>
        </div>
      )}
    </header>
  );
};
