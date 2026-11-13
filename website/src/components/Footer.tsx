import React from 'react';
import { LINKS, PACKAGE_NAME } from '../lib/site';
import { LogoMark } from './Logo';

const COLUMNS = [
  {
    title: 'Docs',
    links: [
      { label: 'Introduction', href: '#/docs/overview' },
      { label: 'Quickstart', href: '#/docs/quickstart' },
      { label: 'Playground', href: '#/playground' },
      { label: 'Storage adapters', href: '#/docs/storage-adapters' },
      { label: 'API reference', href: '#/docs/recovery-provider' },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'GitHub', href: LINKS.github, external: true },
      { label: 'npm', href: LINKS.npm, external: true },
      { label: 'Changelog', href: LINKS.changelog, external: true },
      { label: 'Issues', href: LINKS.issues, external: true },
    ],
  },
];

export const Footer: React.FC = () => (
  <footer className="border-t border-line" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
    <div className="mx-auto flex max-w-[90rem] flex-col gap-10 px-4 py-12 sm:px-6 md:flex-row md:justify-between lg:px-8">
      <div className="max-w-xs">
        <div className="flex items-center gap-2.5">
          <LogoMark size={20} />
          <span className="font-mono text-sm font-medium text-fg">{PACKAGE_NAME}</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">
          Checkpoint and restore interrupted flows in React Native and Expo.
        </p>
        <p className="mt-4 text-sm text-fg-subtle">
          <a href={LINKS.license} target="_blank" rel="noreferrer" className="hover:text-fg">MIT License</a>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-10 sm:gap-16">
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">{col.title}</h2>
            <ul className="mt-3 space-y-1">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    {...('external' in l ? { target: '_blank', rel: 'noreferrer' } : {})}
                    className="inline-block py-1 text-sm text-fg-muted transition-colors hover:text-fg"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </footer>
);
