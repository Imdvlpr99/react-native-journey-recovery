import React from 'react';
import { IconChevronRight } from './Icons';
import { NAV_GROUPS } from './Sidebar';

const FLAT_SECTIONS = NAV_GROUPS.flatMap((g) => g.items);

interface PrevNextProps {
  activeId: string;
  onNavigate: (id: string) => void;
}

export const PrevNext: React.FC<PrevNextProps> = ({ activeId, onNavigate }) => {
  const idx = FLAT_SECTIONS.findIndex((s) => s.id === activeId);
  if (idx === -1) return null;

  const prev = idx > 0 ? FLAT_SECTIONS[idx - 1] : null;
  const next = idx < FLAT_SECTIONS.length - 1 ? FLAT_SECTIONS[idx + 1] : null;

  return (
    <div className="flex items-stretch justify-between gap-3 mt-16 pt-6 border-t border-white/8">
      {prev ? (
        <button
          onClick={() => onNavigate(prev.id)}
          className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all text-left flex-1 max-w-[48%]"
        >
          <IconChevronRight
            size={13}
            className="rotate-180 shrink-0 text-white/25 group-hover:text-violet-400 transition-colors"
          />
          <div className="min-w-0">
            <div className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Previous</div>
            <div className="text-xs font-medium text-white/60 group-hover:text-white truncate transition-colors">
              {prev.label}
            </div>
          </div>
        </button>
      ) : <div className="flex-1" />}

      {next ? (
        <button
          onClick={() => onNavigate(next.id)}
          className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all text-right flex-1 max-w-[48%] ml-auto justify-end"
        >
          <div className="min-w-0">
            <div className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Next</div>
            <div className="text-xs font-medium text-white/60 group-hover:text-white truncate transition-colors">
              {next.label}
            </div>
          </div>
          <IconChevronRight
            size={13}
            className="shrink-0 text-white/25 group-hover:text-violet-400 transition-colors"
          />
        </button>
      ) : <div className="flex-1" />}
    </div>
  );
};
