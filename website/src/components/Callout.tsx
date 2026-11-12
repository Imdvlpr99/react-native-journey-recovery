import React from 'react';
import { IconAlertTriangle, IconCheck, IconShield, IconTerminal } from './Icons';

type CalloutType = 'note' | 'warning' | 'tip' | 'important';

const CONFIG: Record<CalloutType, {
  icon: React.ReactNode;
  border: string;
  bg: string;
  iconCls: string;
  titleCls: string;
  label: string;
}> = {
  note: {
    icon: <IconTerminal size={14} />,
    border: 'border-blue-400/25',
    bg: 'bg-blue-500/8',
    iconCls: 'text-blue-400',
    titleCls: 'text-blue-300',
    label: 'Note',
  },
  warning: {
    icon: <IconAlertTriangle size={14} />,
    border: 'border-amber-400/25',
    bg: 'bg-amber-500/8',
    iconCls: 'text-amber-400',
    titleCls: 'text-amber-300',
    label: 'Warning',
  },
  tip: {
    icon: <IconCheck size={14} />,
    border: 'border-emerald-400/25',
    bg: 'bg-emerald-500/8',
    iconCls: 'text-emerald-400',
    titleCls: 'text-emerald-300',
    label: 'Tip',
  },
  important: {
    icon: <IconShield size={14} />,
    border: 'border-violet-400/25',
    bg: 'bg-violet-500/8',
    iconCls: 'text-violet-400',
    titleCls: 'text-violet-300',
    label: 'Important',
  },
};

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Callout: React.FC<CalloutProps> = ({
  type = 'note',
  title,
  children,
  className = '',
}) => {
  const cfg = CONFIG[type];
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${cfg.border} ${cfg.bg} my-5 ${className}`}>
      <span className={`mt-0.5 shrink-0 ${cfg.iconCls}`}>{cfg.icon}</span>
      <div className="min-w-0 space-y-1">
        <div className={`text-xs font-semibold ${cfg.titleCls}`}>{title ?? cfg.label}</div>
        <div className="text-xs text-white/65 leading-relaxed">{children}</div>
      </div>
    </div>
  );
};
