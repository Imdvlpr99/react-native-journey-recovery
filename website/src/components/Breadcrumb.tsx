import React from 'react';
import { IconChevronRight } from './Icons';
import { NAV_GROUPS } from './Sidebar';

interface BreadcrumbProps {
  activeId: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ activeId }) => {
  let groupTitle = '';
  let itemLabel = '';

  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => i.id === activeId);
    if (item) {
      groupTitle = group.title;
      itemLabel = item.label;
      break;
    }
  }

  if (!groupTitle) return null;

  return (
    <nav
      className="flex items-center gap-1 text-[11px] text-white/30 mb-6"
      aria-label="Breadcrumb"
    >
      <span>Docs</span>
      <IconChevronRight size={10} className="text-white/20 shrink-0" />
      <span className="text-white/45">{groupTitle}</span>
      <IconChevronRight size={10} className="text-white/20 shrink-0" />
      <span className="text-white/60">{itemLabel}</span>
    </nav>
  );
};
