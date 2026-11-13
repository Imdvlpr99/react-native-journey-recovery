import React from 'react';
import {
  IconTerminal, IconLayers, IconDatabase, IconZap, IconShield,
  IconSmartphone, IconSparkles
} from './Icons';

export interface NavItem {
  id: string;
  label: string;
  badge?: string;
}

export interface NavGroup {
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Getting Started',
    icon: <IconTerminal size={14} />,
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'why-journey-recovery', label: 'Why Journey Recovery?' },
      { id: 'installation', label: 'Installation' },
      { id: 'quickstart', label: 'Quickstart in 3 Steps' },
    ],
  },
  {
    title: 'Core Architecture',
    icon: <IconLayers size={14} />,
    items: [
      { id: 'architecture-diagram', label: 'Engine Architecture' },
      { id: 'write-serialization', label: 'Write Serialization Mutex' },
      { id: 'atomic-safety', label: 'Atomic Snapshot Safety' },
      { id: 'checksum-integrity', label: 'FNV-1a Checksums' },
      { id: 'expiry-policies', label: 'TTL Expiration Policies' },
      { id: 'schema-migration', label: 'Schema Version Migration' },
    ],
  },
  {
    title: 'Storage Adapters',
    icon: <IconDatabase size={14} />,
    items: [
      { id: 'storage-adapters', label: 'Adapter Ecosystem' },
      { id: 'storage-mmkv', label: 'MMKV Adapter (C++)' },
      { id: 'storage-secure', label: 'SecureStore (Hardware Keychain)' },
      { id: 'storage-async', label: 'AsyncStorage Adapter' },
      { id: 'storage-memory', label: 'Memory Adapter (Testing)' },
      { id: 'storage-comparison', label: 'Comparison & Sizing Calc' },
    ],
  },
  {
    title: 'Navigation Adapters',
    icon: <IconSmartphone size={14} />,
    items: [
      { id: 'nav-react-navigation', label: 'React Navigation' },
      { id: 'nav-expo-router', label: 'Expo Router (File-Based)', badge: 'Expo' },
    ],
  },
  {
    title: 'Form & State Sync',
    icon: <IconZap size={14} />,
    items: [
      { id: 'form-integrations', label: 'Integration Overview' },
      { id: 'integration-hook-form', label: 'React Hook Form' },
      { id: 'integration-formik', label: 'Formik' },
      { id: 'integration-zustand', label: 'Zustand Slices' },
      { id: 'integration-redux', label: 'Redux Toolkit Slices' },
      { id: 'integration-tanstack-query', label: 'TanStack Query Sync' },
    ],
  },
  {
    title: 'Validation & Privacy',
    icon: <IconShield size={14} />,
    items: [
      { id: 'validation-zod', label: 'Zod Schema Validation' },
      { id: 'security-privacy', label: 'Field Exclusions (PCI/PII)' },
      { id: 'user-scoping', label: 'User Identity Scoping' },
    ],
  },
  {
    title: 'UI & Tools',
    icon: <IconSparkles size={14} />,
    items: [
      { id: 'ui-components', label: 'Recovery UI Components' },
      { id: 'cli-tools', label: 'CLI Tools & CI Verify' },
      { id: 'testing-utilities', label: 'Testing Environment' },
      { id: 'api-reference', label: 'API Reference' },
    ],
  },
];

interface SidebarProps {
  activeId: string;
  isOpen: boolean;
  onSelect: (id: string) => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeId, isOpen, onSelect, onCloseMobile }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#13112a]/95 backdrop-blur-xl pt-16 pb-6 px-5 overflow-y-auto border-r border-white/10 transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:w-60 lg:py-6 lg:px-4 lg:bg-transparent lg:backdrop-blur-none lg:border-r lg:border-white/8 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto lg:shrink-0`}
      >
        {/* Navigation Group Tree */}
        <div className="space-y-5">
          {NAV_GROUPS.map((group) => {
            const filteredItems = group.items;

            if (filteredItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <div className="w-full flex items-center gap-2 py-1 text-[11px] font-semibold tracking-wider uppercase text-white/30">
                  <span className="text-white/20">{group.icon}</span>
                  <span>{group.title}</span>
                </div>

                <div className="space-y-0.5 pl-2.5 border-l border-white/10">
                  {filteredItems.map((item) => {
                    const isActive = activeId === item.id;
                    return (
                      <a
                        key={item.id}
                        href={`#/docs/${item.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onSelect(item.id);
                          onCloseMobile();
                          const el = document.getElementById(item.id);
                          if (el && typeof el.scrollIntoView === 'function') {
                            el.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                          isActive
                            ? 'text-[#22C7F2] font-semibold bg-[#22C7F2]/10 border-l-2 -ml-[2px] border-[#22C7F2]'
                            : 'text-white/50 hover:text-white/80 hover:bg-white/8'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-[#22C7F2] bg-[#22C7F2]/10 border border-[#22C7F2]/20 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
};
