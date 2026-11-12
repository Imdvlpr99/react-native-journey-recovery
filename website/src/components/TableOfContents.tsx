import React from 'react';
import { IconGithub, IconExternalLink } from './Icons';

export interface TocItem {
  id: string;
  label: string;
  depth?: number;
}

export const TOC_SECTIONS: TocItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'why-journey-recovery', label: 'Why Journey Recovery?' },
  { id: 'installation', label: 'Installation' },
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'architecture-diagram', label: 'Engine Architecture' },
  { id: 'write-serialization', label: 'Write Serialization Mutex' },
  { id: 'atomic-safety', label: 'Atomic Snapshot Safety' },
  { id: 'checksum-integrity', label: 'FNV-1a Checksums' },
  { id: 'expiry-policies', label: 'TTL Expiry Policies' },
  { id: 'schema-migration', label: 'Schema Version Migration' },
  { id: 'storage-adapters', label: 'Storage Adapters' },
  { id: 'storage-comparison', label: 'Adapter Comparison & Calc' },
  { id: 'navigation-adapters', label: 'Navigation Adapters' },
  { id: 'form-integrations', label: 'Form & State Integrations' },
  { id: 'validation-zod', label: 'Zod Schema Validation' },
  { id: 'security-privacy', label: 'Privacy & Scoping' },
  { id: 'ui-components', label: 'Recovery UI Components' },
  { id: 'cli-tools', label: 'CLI Tools & CI Verify' },
  { id: 'testing-utilities', label: 'Testing Utilities' },
  { id: 'api-reference', label: 'API Reference' },
];

interface TableOfContentsProps {
  activeId: string;
  onSelect: (id: string) => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ activeId, onSelect }) => {
  return (
    <aside className="hidden xl:block w-56 shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-4 text-xs pr-2">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-3">
        On This Page
      </div>

      <nav className="flex flex-col space-y-1 border-l border-white/10">
        {TOC_SECTIONS.map((item) => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              href={`#/docs/${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                onSelect(item.id);
                const el = document.getElementById(item.id);
                if (el && typeof el.scrollIntoView === 'function') {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className={`block pl-3 py-1 transition-colors ${
                isActive
                  ? 'text-violet-300 font-semibold border-l-2 -ml-[2px] border-violet-500'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-white/10 space-y-2">
        <a
          href="https://github.com/Imdvlpr99/react-native-journey-recovery"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-white/40 hover:text-violet-300 transition-colors"
        >
          <IconGithub size={13} />
          <span>Star on GitHub</span>
          <IconExternalLink size={11} className="opacity-60" />
        </a>
        <a
          href="https://github.com/Imdvlpr99/react-native-journey-recovery/issues"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-white/40 hover:text-violet-300 transition-colors"
        >
          <span>Report an issue</span>
          <IconExternalLink size={11} className="opacity-60" />
        </a>
      </div>

    </aside>
  );
};
