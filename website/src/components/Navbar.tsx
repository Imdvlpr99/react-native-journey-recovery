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
    <header className="sticky top-0 z-50 h-14 w-full border-b border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 transition-colors">
      {/* Top scroll progress bar */}
      <div
        className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-violet-500 to-blue-400 transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        {/* Left: Sidebar toggle (docs only) & Brand */}
        <div className="flex items-center gap-3">
          {showSidebarToggle && onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-white/15 bg-white/8 text-white/70 hover:text-white text-xs font-medium cursor-pointer backdrop-blur-sm"
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
            className="flex items-center gap-2.5 text-white font-semibold tracking-tight text-sm hover:opacity-90 transition-opacity"
          >
            <img
              src="./logo.png"
              alt="react-native-journey-recovery"
              className="w-6 h-6 rounded-md object-contain"
            />
            <span className="hidden sm:inline font-bold text-white">
              journey-recovery
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-violet-300 bg-violet-500/15 border border-violet-400/25">
              v0.1.0
            </span>
          </a>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-0.5 p-0.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => handleTabClick('home')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'home'
                ? 'bg-violet-500/20 text-violet-200 font-semibold border border-violet-400/30 shadow-sm shadow-violet-500/20'
                : 'text-white/50 hover:text-white/80 hover:bg-white/8'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('docs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'bg-violet-500/20 text-violet-200 font-semibold border border-violet-400/30 shadow-sm shadow-violet-500/20'
                : 'text-white/50 hover:text-white/80 hover:bg-white/8'
            }`}
          >
            Documentation
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('architecture')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'bg-violet-500/20 text-violet-200 font-semibold border border-violet-400/30 shadow-sm shadow-violet-500/20'
                : 'text-white/50 hover:text-white/80 hover:bg-white/8'
            }`}
          >
            <IconLayers size={13} />
            <span>Architecture</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('storage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'storage'
                ? 'bg-violet-500/20 text-violet-200 font-semibold border border-violet-400/30 shadow-sm shadow-violet-500/20'
                : 'text-white/50 hover:text-white/80 hover:bg-white/8'
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
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 text-xs transition-colors cursor-pointer"
            aria-label="Search documentation"
            title="Search documentation (⌘K or Ctrl+K)"
          >
            <IconSearch size={13} className="text-white/40" />
            <span>Search docs...</span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/8 text-white/40 border border-white/10">
              ⌘K
            </kbd>
          </button>

          {/* Mobile search icon only */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="sm:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Search documentation"
          >
            <IconSearch size={17} />
          </button>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={onThemeToggle}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
            title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
          >
            {theme === 'dark' ? <IconSun size={16} className="text-amber-300" /> : <IconMoon size={16} className="text-violet-300" />}
          </button>

          {/* GitHub Repository Link */}
          <a
            href="https://github.com/Imdvlpr99/react-native-journey-recovery"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="GitHub Repository"
            title="GitHub Repository"
          >
            <IconGithub size={17} />
          </a>

          {/* Mobile navigation menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <IconX size={18} /> : <IconMenu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation dropdown drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3 space-y-0.5">
          <button
            type="button"
            onClick={() => handleTabClick('home')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'home'
                ? 'bg-violet-500/20 text-violet-200 font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/8'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('docs')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'docs'
                ? 'bg-violet-500/20 text-violet-200 font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/8'
            }`}
          >
            Documentation
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('architecture')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
              activeTab === 'architecture'
                ? 'bg-violet-500/20 text-violet-200 font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/8'
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
                ? 'bg-violet-500/20 text-violet-200 font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/8'
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
