import React from 'react';

export interface NavItem {
  id: string;
  label: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Getting Started',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'why-journey-recovery', label: 'Why Journey Recovery?' },
      { id: 'installation', label: 'Installation' },
      { id: 'quickstart', label: 'Quickstart' },
    ],
  },
  {
    title: 'Core Architecture',
    items: [
      { id: 'write-serialization', label: 'Write Serialization & Mutex' },
      { id: 'atomic-safety', label: 'Atomic Snapshot Preservation' },
      { id: 'checksum-integrity', label: 'FNV-1a Checksum Integrity' },
      { id: 'expiry-policies', label: 'TTL Expiration Policies' },
      { id: 'schema-migration', label: 'Schema Version Migration' },
    ],
  },
  {
    title: 'Storage Adapters',
    items: [
      { id: 'storage-async', label: 'AsyncStorageAdapter' },
      { id: 'storage-mmkv', label: 'MMKVStorageAdapter' },
      { id: 'storage-secure', label: 'SecureStoreAdapter (Expo)' },
      { id: 'storage-memory', label: 'MemoryStorageAdapter' },
      { id: 'storage-custom', label: 'Custom Storage Adapter' },
    ],
  },
  {
    title: 'Navigation Adapters',
    items: [
      { id: 'nav-react-navigation', label: 'React Navigation' },
      { id: 'nav-expo-router', label: 'Expo Router' },
    ],
  },
  {
    title: 'Form & State Integrations',
    items: [
      { id: 'integration-hook-form', label: 'React Hook Form' },
      { id: 'integration-formik', label: 'Formik' },
      { id: 'integration-zustand', label: 'Zustand Slices' },
      { id: 'integration-redux', label: 'Redux Slices' },
      { id: 'integration-tanstack-query', label: 'TanStack Query Coordination' },
    ],
  },
  {
    title: 'Validation & Security',
    items: [
      { id: 'validation-zod', label: 'Zod Schema Validation' },
      { id: 'security-privacy', label: 'Privacy & Field Exclusions' },
      { id: 'user-scoping', label: 'User Identity Scoping' },
    ],
  },
  {
    title: 'UI & Diagnostics',
    items: [
      { id: 'ui-recovery-banner', label: 'RecoveryBanner Component' },
      { id: 'ui-recovery-modal', label: 'RecoveryModal & BottomSheet' },
      { id: 'diagnostics', label: 'Recovery Diagnostics' },
      { id: 'cli-tools', label: 'CLI Inspection & Verify Tool' },
      { id: 'testing-utilities', label: 'Testing Utilities' },
      { id: 'interactive-simulator', label: 'Live Interactive Simulator' },
      { id: 'interactive-playground', label: 'Schema & Hash Playground' },
      { id: 'api-reference', label: 'API Reference' },
    ],
  },
];

interface SidebarProps {
  activeId: string;
  searchTerm: string;
  isOpen: boolean;
  onSelect: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeId, searchTerm, isOpen, onSelect }) => {
  const term = searchTerm.toLowerCase().trim();

  return (
    <aside
      className={`docs-sidebar ${isOpen ? 'open' : ''}`}
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        height: 'calc(100vh - var(--header-height))',
        position: 'sticky',
        top: 'var(--header-height)',
        overflowY: 'auto',
        padding: '24px 16px',
        borderRight: '1px solid var(--border-color)',
        background: 'var(--bg-primary)',
      }}
    >
      {NAV_GROUPS.map((group) => {
        const filteredItems = group.items.filter((item) =>
          term === '' ? true : item.label.toLowerCase().includes(term)
        );

        if (filteredItems.length === 0) return null;

        return (
          <div key={group.title} style={{ marginBottom: '24px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.8px',
              paddingInline: '12px',
              marginBottom: '8px',
            }}>
              {group.title}
            </div>
            {filteredItems.map((item) => {
              const isActive = activeId === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelect(item.id);
                    const el = document.getElementById(item.id);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  style={{
                    display: 'block',
                    padding: '6px 12px',
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    borderRadius: '6px',
                    transition: 'all 0.15s',
                  }}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        );
      })}
    </aside>
  );
};

