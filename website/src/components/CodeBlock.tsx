import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { highlight, Lang } from '../lib/highlight';
import { CheckIcon, CopyIcon } from './Icons';

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      // Clipboard can be blocked (insecure origin, permissions). The code stays selectable.
      console.warn('Copy to clipboard failed', err);
    }
  };

  return { copied, copy };
}

export const CopyButton: React.FC<{ text: string; label?: string; className?: string }> = ({
  text,
  label = 'Copy code',
  className = '',
}) => {
  const { copied, copy } = useCopy(text);
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied' : label}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#8b98ab] transition-colors hover:bg-white/10 hover:text-white ${className}`}
    >
      {copied ? <CheckIcon size={15} className="text-[#4ade80]" /> : <CopyIcon size={15} />}
      <span className="sr-only" aria-live="polite">{copied ? 'Copied to clipboard' : ''}</span>
    </button>
  );
};

const Highlighted: React.FC<{ code: string; lang: Lang }> = ({ code, lang }) => {
  const tokens = useMemo(() => highlight(code, lang), [code, lang]);
  return (
    <>
      {tokens.map((t, i) =>
        t.kind ? (
          <span key={i} className={`tok-${t.kind}`}>{t.text}</span>
        ) : (
          <React.Fragment key={i}>{t.text}</React.Fragment>
        )
      )}
    </>
  );
};

interface CodeBlockProps {
  code: string;
  lang?: Lang;
  /** File name or short label shown in the header bar. */
  title?: string;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, lang = 'tsx', title, className = '' }) => {
  const trimmed = code.replace(/^\n+|\s+$/g, '');
  return (
    <div className={`not-prose group relative overflow-hidden rounded-lg border border-code-line bg-code ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] pl-4 pr-1.5 py-1">
          <span className="truncate font-mono text-xs text-[#8b98ab]">{title}</span>
          <CopyButton text={trimmed} />
        </div>
      ) : (
        <div className="absolute right-0 top-0 z-10 rounded-bl-lg bg-code p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <CopyButton text={trimmed} />
        </div>
      )}
      <pre className={`scroll-thin overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-[1.7] text-[#d8dee9] ${title ? '' : 'pr-12 sm:pr-4'}`}>
        <code>
          <Highlighted code={trimmed} lang={lang} />
        </code>
      </pre>
    </div>
  );
};

interface CodeTabsProps {
  tabs: { label: string; code: string; lang?: Lang }[];
  className?: string;
}

/** Tabbed code (package managers, file pairs). Implements the WAI-ARIA tabs pattern. */
export const CodeTabs: React.FC<CodeTabsProps> = ({ tabs, className = '' }) => {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = tabs[active];
  const trimmed = current.code.replace(/^\n+|\s+$/g, '');

  const onKeyDown = (e: React.KeyboardEvent) => {
    let next = active;
    if (e.key === 'ArrowRight') next = (active + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (active - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  };

  return (
    <div className={`not-prose overflow-hidden rounded-lg border border-code-line bg-code ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] pr-1.5">
        <div role="tablist" aria-label="Code variants" className="scroll-thin flex overflow-x-auto" onKeyDown={onKeyDown}>
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              ref={(el) => { refs.current[i] = el; }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${baseId}-panel`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={`relative whitespace-nowrap px-4 py-2.5 font-mono text-xs transition-colors ${
                i === active ? 'text-white' : 'text-[#8b98ab] hover:text-[#d8dee9]'
              }`}
            >
              {tab.label}
              {i === active && <span className="absolute inset-x-3 -bottom-px h-px bg-[#4ade80]" />}
            </button>
          ))}
        </div>
        <CopyButton text={trimmed} />
      </div>
      <pre
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        tabIndex={0}
        className="scroll-thin overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-[1.7] text-[#d8dee9]"
      >
        <code key={active} className="anim-swap">
          <Highlighted code={trimmed} lang={current.lang ?? 'tsx'} />
        </code>
      </pre>
    </div>
  );
};
