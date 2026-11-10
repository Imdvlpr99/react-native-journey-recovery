import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NAV_GROUPS } from './components/Sidebar';
import { Hero } from './components/Hero';
import { Sections } from './components/Sections';

export const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        input?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // IntersectionObserver to highlight current active section on scroll
  useEffect(() => {
    const sectionElements = document.querySelectorAll('.doc-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: '1440px',
        marginInline: 'auto',
        position: 'relative',
        flex: 1,
      }}>
        <Sidebar
          activeId={activeId}
          searchTerm={searchTerm}
          isOpen={sidebarOpen}
          onSelect={(id) => {
            setActiveId(id);
            setSidebarOpen(false);
          }}
        />

        <main style={{
          flex: 1,
          minWidth: 0,
          padding: '40px 48px 120px 48px',
          maxWidth: '1020px',
        }}>
          <Hero />
          <Sections />
        </main>
      </div>

      <footer style={{
        padding: '24px',
        textAlign: 'center',
        borderTop: '1px solid var(--border-color)',
        fontSize: '13px',
        color: 'var(--text-muted)',
        background: 'var(--bg-secondary)',
      }}>
        MIT © 2026 Imdvlpr99 · Built with React &amp; TypeScript · <a href="https://github.com/Imdvlpr99/react-native-journey-recovery" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>GitHub Repository</a>
      </footer>
    </div>
  );
};

