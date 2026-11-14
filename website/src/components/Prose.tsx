import React from 'react';
import { docsHref } from '../lib/router';
import { DangerIcon, HashIcon, InfoIcon, TipIcon, WarningIcon } from './Icons';

/* ------------------------------------------------------------------
   Headings with stable ids and a hover anchor link.
   OnThisPage reads h2/h3[id] from the rendered article.
   ------------------------------------------------------------------ */
const Anchor: React.FC<{ id: string }> = ({ id }) => (
  <a
    href={`#${id}`}
    onClick={(e) => {
      e.preventDefault();
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `${window.location.pathname}#${id}`);
    }}
    aria-label="Link to this section"
    className="no-prose ml-2 inline-flex translate-y-[1px] align-middle text-fg-subtle opacity-0 transition-opacity hover:text-accent focus-visible:opacity-100 group-hover:opacity-100"
  >
    <HashIcon size={14} />
  </a>
);

export const H2: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h2 id={id} className="group scroll-mt-24">
    {children}
    <Anchor id={id} />
  </h2>
);

export const H3: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h3 id={id} className="group scroll-mt-24">
    {children}
    <Anchor id={id} />
  </h3>
);

/* ------------------------------------------------------------------
   Internal doc link
   ------------------------------------------------------------------ */
export const DocLink: React.FC<{ to: string; heading?: string; children: React.ReactNode }> = ({
  to,
  heading,
  children,
}) => <a href={docsHref(to, heading)}>{children}</a>;

/* ------------------------------------------------------------------
   Callout
   ------------------------------------------------------------------ */
type CalloutType = 'note' | 'tip' | 'warning' | 'danger';

const CALLOUT_STYLES: Record<CalloutType, { box: string; icon: React.ReactNode; label: string }> = {
  note: { box: 'border-info/30 bg-info-soft', icon: <InfoIcon size={16} className="text-info" />, label: 'Note' },
  tip: { box: 'border-accent/30 bg-accent-soft', icon: <TipIcon size={16} className="text-accent" />, label: 'Tip' },
  warning: { box: 'border-warn/30 bg-warn-soft', icon: <WarningIcon size={16} className="text-warn" />, label: 'Warning' },
  danger: { box: 'border-danger/30 bg-danger-soft', icon: <DangerIcon size={16} className="text-danger" />, label: 'Important' },
};

export const Callout: React.FC<{ type?: CalloutType; title?: string; children: React.ReactNode }> = ({
  type = 'note',
  title,
  children,
}) => {
  const s = CALLOUT_STYLES[type];
  return (
    <aside className={`flex gap-3 rounded-lg border px-4 py-3.5 text-[0.9375rem] leading-relaxed ${s.box}`}>
      <span className="mt-[3px] shrink-0">{s.icon}</span>
      <div className="min-w-0 [&>*+*]:mt-2">
        <p className="font-semibold text-fg">{title ?? s.label}</p>
        <div className="[&>*+*]:mt-2">{children}</div>
      </div>
    </aside>
  );
};

/* ------------------------------------------------------------------
   Tables
   ------------------------------------------------------------------ */
export const Table: React.FC<{ head: React.ReactNode[]; rows: React.ReactNode[][]; caption?: string }> = ({
  head,
  rows,
  caption,
}) => (
  <div className="scroll-thin -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
    <table className="w-full min-w-[34rem] border-collapse text-left text-[0.9rem]">
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead>
        <tr className="border-b border-line-strong">
          {head.map((h, i) => (
            <th key={i} scope="col" className="whitespace-nowrap py-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r} className="border-b border-line align-top last:border-0">
            {row.map((cell, c) => (
              <td key={c} className={`py-3 pr-4 ${c === 0 ? 'text-fg' : ''}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export interface PropRow {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: React.ReactNode;
}

/**
 * API property list. Renders as stacked definitions rather than a wide table,
 * so long TypeScript types stay readable on phones.
 */
export const PropTable: React.FC<{ rows: PropRow[] }> = ({ rows }) => (
  <dl className="divide-y divide-line overflow-hidden rounded-lg border border-line">
    {rows.map((row) => (
      <div key={row.name} className="px-4 py-3.5">
        <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <code className="font-mono text-[0.875rem] font-medium !border-0 !bg-transparent !p-0 !text-fg">{row.name}</code>
          <code className="font-mono text-[0.8125rem] !border-0 !bg-transparent !p-0 !text-info">{row.type}</code>
          {row.required && (
            <span className="rounded border border-warn/40 px-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-warn">
              required
            </span>
          )}
          {row.default !== undefined && (
            <span className="text-[0.8125rem] text-fg-subtle">
              default <code className="font-mono !text-[0.8125rem]">{row.default}</code>
            </span>
          )}
        </dt>
        <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-fg-muted">{row.description}</dd>
      </div>
    ))}
  </dl>
);

/* ------------------------------------------------------------------
   Numbered steps
   ------------------------------------------------------------------ */
export const Steps: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ol className="!list-none !pl-0 [counter-reset:step]">{children}</ol>
);

export const Step: React.FC<{ title: string; id?: string; children: React.ReactNode }> = ({ title, id, children }) => (
  <li className="relative border-l border-line pb-8 pl-8 last:pb-0 [counter-increment:step] before:absolute before:-left-[13px] before:top-0 before:flex before:h-[26px] before:w-[26px] before:items-center before:justify-center before:rounded-full before:border before:border-line-strong before:bg-bg before:font-mono before:text-xs before:text-fg before:content-[counter(step)]">
    <h3 id={id} className="!mt-0 scroll-mt-24 leading-[26px]">{title}</h3>
    <div className="mt-3 [&>*+*]:mt-4">{children}</div>
  </li>
);

/* ------------------------------------------------------------------
   Status chip, used for RecoveryStatus values
   ------------------------------------------------------------------ */
const STATUS_TONE: Record<string, string> = {
  available: 'text-accent border-accent/35',
  restored: 'text-accent border-accent/35',
  active: 'text-info border-info/35',
  checking: 'text-fg-muted border-line-strong',
  restoring: 'text-fg-muted border-line-strong',
  idle: 'text-fg-muted border-line-strong',
  discarded: 'text-fg-muted border-line-strong',
  expired: 'text-warn border-warn/35',
  invalid: 'text-danger border-danger/35',
  failed: 'text-danger border-danger/35',
};

export const Status: React.FC<{ value: string }> = ({ value }) => (
  <code
    className={`inline-block whitespace-nowrap rounded-md border !bg-transparent px-1.5 py-px font-mono text-[0.8125rem] ${
      STATUS_TONE[value] ?? 'text-fg-muted border-line-strong'
    }`}
  >
    {value}
  </code>
);
