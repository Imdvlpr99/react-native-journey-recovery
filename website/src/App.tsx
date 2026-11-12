import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { Sections } from './components/Sections';
import { Breadcrumb } from './components/Breadcrumb';
import { PrevNext } from './components/PrevNext';
import { SearchModal } from './components/SearchModal';
import { Footer } from './components/Footer';

function parseLocationHash(hash: string): { tab: ActiveTab; sectionId?: string } {
  const raw = hash.replace(/^#\/?/, '').trim();
  if (!raw || raw === 'home') return { tab: 'home' };
  if (raw === 'architecture') return { tab: 'docs', sectionId: 'architecture-diagram' };
  if (raw === 'storage') return { tab: 'docs', sectionId: 'storage-comparison' };
  if (raw.startsWith('docs')) {
    const section = raw.replace(/^docs\/?/, '').trim();
    return { tab: 'docs', sectionId: section || undefined };
  }
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  // ⌘K / Ctrl+K
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

  // Hash router
  useEffect(() => {
    const handleHashChange = () => {
      const { tab, sectionId } = parseLocationHash(window.location.hash);
      setActiveTab(tab);
      if (tab === 'docs' && sectionId) setActiveId(sectionId);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToSection = (id: string) => {
    setActiveTab('docs');
    setActiveId(id);
    setSidebarOpen(false);
    window.location.hash = `#/docs/${id}`;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleNavigate = (tab: ActiveTab, sectionId?: string) => {
    // Redirect legacy top-level views into doc sections
    if (tab === 'architecture') {
      navigateToSection('architecture-diagram');
      return;
    }
    if (tab === 'storage') {
      navigateToSection('storage-comparison');
      return;
    }

    setActiveTab(tab);
    setSidebarOpen(false);

    if (tab === 'home') {
      window.location.hash = '#/';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'docs') {
      if (sectionId) {
        navigateToSection(sectionId);
      } else {
        window.location.hash = '#/docs';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[var(--text-main)] selection:bg-violet-500/20 selection:text-violet-300">
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelect={(id) => {
          setSearchModalOpen(false);
          navigateToSection(id);
        }}
      />

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

      {/* HOME */}
      {activeTab === 'home' && (
        <LandingPage
          onNavigate={handleNavigate}
          onOpenSearch={() => setSearchModalOpen(true)}
        />
      )}

      {/* DOCS – 2-column: sidebar + content */}
      {activeTab === 'docs' && (
        <div className="flex-1 flex">
          <Sidebar
            activeId={activeId}
            isOpen={sidebarOpen}
            onSelect={navigateToSection}
            onCloseMobile={() => setSidebarOpen(false)}
          />

          <main className="flex-1 min-w-0">
            <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
              <Breadcrumb activeId={activeId} />
              <Sections activeId={activeId} />
              <PrevNext activeId={activeId} onNavigate={navigateToSection} />
            </div>
            <Footer onNavigate={handleNavigate} />
          </main>
        </div>
      )}

      {/* Footer on home view */}
      {activeTab === 'home' && <Footer onNavigate={handleNavigate} />}
    </div>
  );
};
