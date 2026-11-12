import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { Sections } from './components/Sections';
import { TableOfContents } from './components/TableOfContents';
import { SearchModal } from './components/SearchModal';
import { Footer } from './components/Footer';
import { ArchitectureVisualizer } from './components/ArchitectureVisualizer';
import { StorageComparison } from './components/StorageComparison';

function parseLocationHash(hash: string): { tab: ActiveTab; sectionId?: string } {
  const raw = hash.replace(/^#\/?/, '').trim();
  if (!raw || raw === 'home') return { tab: 'home' };
  if (raw === 'architecture') return { tab: 'architecture' };
  if (raw === 'storage') return { tab: 'storage' };
  if (raw.startsWith('docs')) {
    const section = raw.replace(/^docs\/?/, '').trim();
    return { tab: 'docs', sectionId: section || undefined };
  }
  // Any anchor like #quickstart or #installation routes to docs
  return { tab: 'docs', sectionId: raw };
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    return parseLocationHash(window.location.hash).tab;
  });
  const [activeId, setActiveId] = useState(() => {
    return parseLocationHash(window.location.hash).sectionId || 'overview';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Keyboard shortcut: Ctrl+K / Cmd+K opens Spotlight Search anywhere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hash-based router listener
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseLocationHash(window.location.hash);
      setActiveTab(parsed.tab);
      if (parsed.tab === 'docs' && parsed.sectionId) {
        setActiveId(parsed.sectionId);
        setTimeout(() => {
          const el = document.getElementById(parsed.sectionId!);
          if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 50);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Navigation handler
  const handleNavigate = (tab: ActiveTab, sectionId?: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);

    if (tab === 'home') {
      window.location.hash = '#/';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'docs') {
      if (sectionId) {
        window.location.hash = `#/docs/${sectionId}`;
        setActiveId(sectionId);
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 50);
      } else {
        window.location.hash = '#/docs';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.location.hash = `#/${tab}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // IntersectionObserver for docs scroll spy
  useEffect(() => {
    if (activeTab !== 'docs') return;
    if (typeof IntersectionObserver === 'undefined') return;

    const sectionElements = document.querySelectorAll('.doc-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: 0 }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#090b10] dark:text-slate-100 selection:bg-sky-500/20 selection:text-sky-300 transition-colors duration-150">
      {/* Universal Spotlight Search Palette */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelect={(id) => {
          setSearchModalOpen(false);
          handleNavigate('docs', id);
        }}
      />

      {/* Unified Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchModalOpen(true)}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        theme={theme}
        onThemeToggle={toggleTheme}
        showSidebarToggle={activeTab === 'docs'}
      />

      {/* ── VIEW 1: HOME / PRODUCT OVERVIEW ── */}
      {activeTab === 'home' && (
        <LandingPage
          onNavigate={handleNavigate}
          onOpenSearch={() => setSearchModalOpen(true)}
        />
      )}

      {/* ── VIEW 2: DOCUMENTATION (3-Column Layout) ── */}
      {activeTab === 'docs' && (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8 items-start relative">
            <Sidebar
              activeId={activeId}
              isOpen={sidebarOpen}
              onSelect={(id) => {
                setActiveId(id);
                setSidebarOpen(false);
                window.location.hash = `#/docs/${id}`;
              }}
              onCloseMobile={() => setSidebarOpen(false)}
            />

            <main className="flex-1 min-w-0 max-w-3xl lg:max-w-4xl mx-auto space-y-12">
              <Sections />
            </main>

            <TableOfContents
              activeId={activeId}
              onSelect={(id) => {
                setActiveId(id);
                window.location.hash = `#/docs/${id}`;
              }}
            />
          </div>
        </div>
      )}

      {/* ── VIEW 3: ARCHITECTURE PIPELINE VISUALIZER ── */}
      {activeTab === 'architecture' && (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="space-y-1 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
            <p className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">Engine Deep Dive</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Recovery Pipeline &amp; Mutex Queue
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Trace how user input flows from React hooks through the Promise FIFO mutex queue, checksum serializer, and storage adapters to flash storage.
            </p>
          </div>

          <ArchitectureVisualizer />
        </div>
      )}

      {/* ── VIEW 4: STORAGE COMPARISON & CALCULATOR ── */}
      {activeTab === 'storage' && (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="space-y-1 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
            <p className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">Benchmarks &amp; Sizing</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Storage Adapter Decision Matrix
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Compare write latency, memory usage, and security across MMKV, SecureStore, and AsyncStorage with an interactive flash write calculator.
            </p>
          </div>

          <StorageComparison />
        </div>
      )}

      {/* Universal Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};
