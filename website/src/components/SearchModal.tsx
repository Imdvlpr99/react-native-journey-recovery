import React, { useState, useEffect, useRef, useMemo } from 'react';
import { IconSearch, IconX, IconChevronRight, IconTerminal, IconShield, IconZap, IconDatabase, IconLayers } from './Icons';

export interface SearchItem {
  id: string;
  title: string;
  category: 'Guides' | 'Architecture' | 'Adapters' | 'Integrations' | 'Security' | 'UI & Tools';
  description: string;
  keywords: string[];
}

export const SEARCH_INDEX: SearchItem[] = [
  {
    id: 'overview',
    title: 'Engine Overview',
    category: 'Guides',
    description: 'Introduction to react-native-journey-recovery, background crash resilience, and zero native module architecture.',
    keywords: ['overview', 'intro', 'react-native', 'expo', 'session', 'recovery', 'checkpoint', 'crash'],
  },
  {
    id: 'why-journey-recovery',
    title: 'Why Journey Recovery?',
    category: 'Guides',
    description: 'Comparison table: why selective checkpointing beats global store dumps (Redux/Zustand persist).',
    keywords: ['why', 'comparison', 'vs', 'persistence', 'redux-persist', 'storage bloat', 'races'],
  },
  {
    id: 'installation',
    title: 'Installation & Setup',
    category: 'Guides',
    description: 'Install with npm, yarn, pnpm, or Expo and select your storage adapter.',
    keywords: ['install', 'setup', 'npm', 'yarn', 'pnpm', 'expo', 'package'],
  },
  {
    id: 'quickstart',
    title: 'Quickstart (3 Steps)',
    category: 'Guides',
    description: 'Wrap with RecoveryProvider, call useJourney to checkpoint, and restore with useRecovery or RecoveryBanner.',
    keywords: ['quickstart', 'start', 'tutorial', 'steps', 'usejourney', 'userecovery', 'recoveryprovider'],
  },
  {
    id: 'write-serialization',
    title: 'Write Serialization & Mutex Queue',
    category: 'Architecture',
    description: 'Per-journey Promise FIFO queue eliminating concurrent write races during rapid form keystrokes.',
    keywords: ['mutex', 'concurrency', 'serialization', 'fifo', 'queue', 'race condition', 'async'],
  },
  {
    id: 'atomic-safety',
    title: 'Atomic Snapshot Preservation',
    category: 'Architecture',
    description: 'Guarantees the prior committed checkpoint is never destroyed if an in-flight write fails.',
    keywords: ['atomic', 'safety', 'failure', 'preservation', 'rollback', 'disk error', 'quota'],
  },
  {
    id: 'checksum-integrity',
    title: 'FNV-1a Checksum Integrity',
    category: 'Architecture',
    description: 'Deterministic 32-bit FNV-1a checksums protecting restored snapshots from corruption and tampering.',
    keywords: ['checksum', 'fnv1a', 'hash', 'integrity', 'tamper', 'corruption', 'bit-flip', 'validator'],
  },
  {
    id: 'expiry-policies',
    title: 'TTL Expiration & Eviction',
    category: 'Architecture',
    description: 'Time-to-live policies ensuring stale financial, OTP, or checkout journeys are never restored out of date.',
    keywords: ['expiry', 'ttl', 'stale', 'timeout', 'eviction', 'cleanup', 'freshness'],
  },
  {
    id: 'schema-migration',
    title: 'Schema Versioning & Migrations',
    category: 'Architecture',
    description: 'Declare schema versions and forward-transform saved checkpoints safely between app releases.',
    keywords: ['schema', 'migration', 'version', 'breaking', 'transform', 'upgrade'],
  },
  {
    id: 'storage-adapters',
    title: 'Storage Adapter Ecosystem',
    category: 'Adapters',
    description: 'Pluggable storage engine supporting Memory, MMKV, AsyncStorage, and Expo SecureStore.',
    keywords: ['storage', 'adapter', 'pluggable', 'disk', 'persistence', 'interface'],
  },
  {
    id: 'storage-mmkv',
    title: 'react-native-mmkv Adapter',
    category: 'Adapters',
    description: 'High-speed C++ synchronous MMKV adapter for zero-overhead checkpointing on Android & iOS.',
    keywords: ['mmkv', 'fast', 'c++', 'synchronous', 'high-throughput', 'benchmark'],
  },
  {
    id: 'storage-secure',
    title: 'Expo SecureStore Adapter',
    category: 'Adapters',
    description: 'Hardware-backed Keychain (iOS) & Keystore / EncryptedSharedPreferences (Android) adapter.',
    keywords: ['securestore', 'keychain', 'keystore', 'hardware', 'encrypted', 'pci', 'pii'],
  },
  {
    id: 'storage-async',
    title: 'AsyncStorage Adapter',
    category: 'Adapters',
    description: 'Standard asynchronous storage adapter compatible with existing React Native & Expo codebases.',
    keywords: ['asyncstorage', 'standard', 'expo', 'sqlite'],
  },
  {
    id: 'storage-comparison',
    title: 'Storage Comparison & Calculator',
    category: 'Adapters',
    description: 'Benchmark latency, write throughput, and flash memory wear calculator across adapters.',
    keywords: ['comparison', 'benchmark', 'calculator', 'wear', 'latency', 'iops'],
  },
  {
    id: 'nav-react-navigation',
    title: 'React Navigation Integration',
    category: 'Adapters',
    description: 'Automatically track current active routes and restore screen stacks on application relaunch.',
    keywords: ['react-navigation', 'routes', 'stack', 'navigate', 'tabs'],
  },
  {
    id: 'nav-expo-router',
    title: 'Expo Router File-Based Routing',
    category: 'Adapters',
    description: 'Restore typed file-based route paths, dynamic segments, and search parameters.',
    keywords: ['expo-router', 'file-based', 'slug', 'params', 'deep-link'],
  },
  {
    id: 'integration-hook-form',
    title: 'React Hook Form Integration',
    category: 'Integrations',
    description: 'Debounced form state persistence and auto-fill restoration with React Hook Form.',
    keywords: ['react-hook-form', 'hook-form', 'form', 'inputs', 'debounce'],
  },
  {
    id: 'integration-formik',
    title: 'Formik Integration',
    category: 'Integrations',
    description: 'Seamless two-way sync between Formik values and Journey Recovery checkpoints.',
    keywords: ['formik', 'form', 'validation', 'inputs'],
  },
  {
    id: 'integration-zustand',
    title: 'Zustand Selective Persistence',
    category: 'Integrations',
    description: 'Selective slice recovery for Zustand stores without dumping global application state.',
    keywords: ['zustand', 'slice', 'store', 'state', 'usejourneyzustand'],
  },
  {
    id: 'integration-redux',
    title: 'Redux Toolkit Slice Integration',
    category: 'Integrations',
    description: 'Persist and hydrate active checkout or multi-step journey slices into Redux Toolkit.',
    keywords: ['redux', 'redux-toolkit', 'rtk', 'slice', 'store', 'usejourneyredux'],
  },
  {
    id: 'integration-tanstack-query',
    title: 'TanStack Query Sync',
    category: 'Integrations',
    description: 'Coordinate restored client state with React Query cache invalidation and revalidation.',
    keywords: ['tanstack', 'react-query', 'query', 'cache', 'invalidation', 'server-state'],
  },
  {
    id: 'validation-zod',
    title: 'Zod Runtime Schema Validation',
    category: 'Security',
    description: 'Guard restored payloads with Zod schemas to guarantee structural validity before state restore.',
    keywords: ['zod', 'validation', 'schema', 'type-safety', 'guard', 'corrupt'],
  },
  {
    id: 'security-privacy',
    title: 'Sensitive Field Exclusions (PCI/PII)',
    category: 'Security',
    description: 'Exclude passwords, CVV codes, tokens, and social security numbers from ever hitting mobile disk.',
    keywords: ['security', 'privacy', 'pci', 'pii', 'exclude', 'password', 'credit-card', 'cvv'],
  },
  {
    id: 'user-scoping',
    title: 'Multi-User Scoping & Isolation',
    category: 'Security',
    description: 'Isolate journey checkpoints by tenant or user ID; auto-flush on user logout.',
    keywords: ['user', 'scope', 'multi-user', 'logout', 'isolation', 'tenant'],
  },
  {
    id: 'ui-components',
    title: 'Prebuilt Recovery UI Components',
    category: 'UI & Tools',
    description: 'Drop-in RecoveryBanner, RecoveryModal, and RecoveryBottomSheet components.',
    keywords: ['ui', 'banner', 'modal', 'bottomsheet', 'prompt', 'resume', 'discard'],
  },
  {
    id: 'cli-tools',
    title: 'CLI Inspection & CI Verify',
    category: 'UI & Tools',
    description: 'Inspect stored checkpoints via npx journey-recovery inspect and run automated CI verification.',
    keywords: ['cli', 'terminal', 'inspect', 'verify', 'ci', 'npx'],
  },
  {
    id: 'testing-utilities',
    title: 'Isolated Testing Harness',
    category: 'UI & Tools',
    description: 'createTestRecoveryEnvironment utilities for Vitest, Jest, and React Native Testing Library.',
    keywords: ['test', 'vitest', 'jest', 'testing-library', 'mock', 'harness'],
  },
  {
    id: 'api-reference',
    title: 'Complete API Reference',
    category: 'Guides',
    description: 'Full TypeScript type definitions, hooks, options, and error code specifications.',
    keywords: ['api', 'reference', 'types', 'typescript', 'errors', 'exports'],
  },
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const categories = ['All', 'Guides', 'Architecture', 'Adapters', 'Integrations', 'Security', 'UI & Tools'];

  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    return SEARCH_INDEX.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;

      const titleMatch = item.title.toLowerCase().includes(q);
      const descMatch = item.description.toLowerCase().includes(q);
      const keywordMatch = item.keywords.some((k) => k.toLowerCase().includes(q));

      return titleMatch || descMatch || keywordMatch;
    });
  }, [query, selectedCategory]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          handleSelect(filteredResults[selectedIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex]);

  // Keep selected item in view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Guides': return <IconTerminal size={13} className="text-violet-400" />;
      case 'Architecture': return <IconLayers size={13} className="text-blue-400" />;
      case 'Adapters': return <IconDatabase size={13} className="text-emerald-400" />;
      case 'Integrations': return <IconZap size={13} className="text-amber-400" />;
      case 'Security': return <IconShield size={13} className="text-rose-400" />;
      default: return <IconTerminal size={13} className="text-violet-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#1a1730]/95 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
          <IconSearch size={16} className="text-white/35 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search docs, hooks, adapters…"
            className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-white/30"
            aria-label="Search documentation"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-white/30 hover:text-white/70 cursor-pointer transition-colors"
              aria-label="Clear"
            >
              <IconX size={14} />
            </button>
          ) : (
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/8 text-white/25 border border-white/10">
              ESC
            </kbd>
          )}
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-white/8 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-violet-500/20 text-violet-200 border border-violet-400/30'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/8'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-0.5 flex-1">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-medium text-white/60">No results found</p>
              <p className="text-xs text-white/30">
                Try{' '}
                <button onClick={() => setQuery('mutex')} className="text-violet-400 underline cursor-pointer">mutex</button>,{' '}
                <button onClick={() => setQuery('mmkv')} className="text-violet-400 underline cursor-pointer">mmkv</button>, or{' '}
                <button onClick={() => setQuery('zod')} className="text-violet-400 underline cursor-pointer">zod</button>
              </p>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-violet-500/15 text-white'
                      : 'hover:bg-white/5 text-white/70'
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${isSelected ? 'border-violet-400/30 bg-violet-500/15' : 'border-white/8 bg-white/5'}`}>
                      {getCategoryIcon(item.category)}
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>
                          {item.title}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-white/35 border border-white/8 shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/40 line-clamp-1">{item.description}</p>
                    </div>
                  </div>
                  <IconChevronRight size={13} className="text-white/25 shrink-0 ml-2" />
                </div>
              );
            })
          )}
        </div>

        {/* Keyboard hints */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/8 text-[10px] text-white/25">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white/8 border border-white/10 font-mono">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 rounded bg-white/8 border border-white/10 font-mono">↓</kbd>{' '}
              navigate
            </span>
            <span><kbd className="px-1 py-0.5 rounded bg-white/8 border border-white/10 font-mono">↵</kbd> select</span>
          </div>
          <span>{filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
};
