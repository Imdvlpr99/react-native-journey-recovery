import React from 'react';
import { ActiveTab } from './Navbar';
import { IconGithub, IconExternalLink, IconArrowUp } from './Icons';

interface FooterProps {
  onNavigate?: (tab: ActiveTab, sectionId?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNav = (e: React.MouseEvent, tab: ActiveTab, sectionId?: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(tab, sectionId);
    } else {
      window.location.hash = sectionId ? `#/docs/${sectionId}` : `#/docs`;
    }
  };

  return (
    <footer className="mt-auto w-full border-t border-slate-200/60 dark:border-slate-800/60 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-10 md:gap-16">
          {/* Brand */}
          <div className="shrink-0 max-w-xs space-y-3">
            <div className="flex items-center gap-2">
              <img src="./logo.png" alt="Logo" className="w-6 h-6 rounded-md object-contain" />
              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                journey-recovery
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Deterministic checkpoint recovery for React Native &amp; Expo. MIT License · TypeScript Strict.
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-800">
                MIT
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                100% Coverage
              </span>
            </div>
          </div>

          {/* Nav columns */}
          <div className="flex flex-wrap gap-10 flex-1">
            {/* Documentation */}
            <div className="space-y-3 min-w-[140px]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Documentation
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#/docs/quickstart" onClick={(e) => handleNav(e, 'docs', 'quickstart')} className="text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors">
                    Quickstart (3 Steps)
                  </a>
                </li>
                <li>
                  <a href="#/docs/architecture-diagram" onClick={(e) => handleNav(e, 'docs', 'architecture-diagram')} className="text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors">
                    Engine Architecture
                  </a>
                </li>
                <li>
                  <a href="#/docs/write-serialization" onClick={(e) => handleNav(e, 'docs', 'write-serialization')} className="text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors">
                    Write Serialization Mutex
                  </a>
                </li>
                <li>
                  <a href="#/docs/checksum-integrity" onClick={(e) => handleNav(e, 'docs', 'checksum-integrity')} className="text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors">
                    FNV-1a Checksums
                  </a>
                </li>
                <li>
                  <a href="#/docs/api-reference" onClick={(e) => handleNav(e, 'docs', 'api-reference')} className="text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors">
                    API Reference
                  </a>
                </li>
              </ul>
            </div>

            {/* Architecture & Storage */}
            <div className="space-y-3 min-w-[140px]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Architecture &amp; Storage
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#/architecture" onClick={(e) => handleNav(e, 'architecture')} className="text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors">
                    Write Pipeline &amp; Mutex
                  </a>
                </li>
                <li>
                  <a href="#/storage" onClick={(e) => handleNav(e, 'storage')} className="text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors">
                    Storage Decision Matrix
                  </a>
                </li>
                <li>
                  <a href="#/docs/storage-adapters" onClick={(e) => handleNav(e, 'docs', 'storage-adapters')} className="text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors">
                    MMKV &amp; SecureStore Adapters
                  </a>
                </li>
                <li>
                  <a href="#/docs/validation-zod" onClick={(e) => handleNav(e, 'docs', 'validation-zod')} className="text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors">
                    Zod Schema Validation
                  </a>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div className="space-y-3 min-w-[140px]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Community
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="https://github.com/Imdvlpr99/react-native-journey-recovery"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
                  >
                    <IconGithub size={12} />
                    <span>GitHub Repository</span>
                    <IconExternalLink size={10} className="opacity-50" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Imdvlpr99/react-native-journey-recovery/issues"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
                  >
                    <span>Issue Tracker</span>
                    <IconExternalLink size={10} className="opacity-50" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Imdvlpr99/react-native-journey-recovery/blob/master/CHANGELOG.md"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
                  >
                    <span>Changelog</span>
                    <IconExternalLink size={10} className="opacity-50" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-400 dark:text-slate-500">
          <p>
            MIT © 2026 Imdvlpr99 · Built with React, TypeScript &amp; Tailwind CSS · Zero Native Modules
          </p>
          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <IconArrowUp size={12} />
            <span>Back to top</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
