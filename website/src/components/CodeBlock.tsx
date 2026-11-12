import React, { useState } from 'react';
import { IconCopy, IconCheck, IconTerminal } from './Icons';
import { SyntaxHighlighter } from './SyntaxHighlighter';

export interface CodeTab {
  label: string;
  code: string;
  language?: string;
}

interface CodeBlockProps {
  code?: string;
  language?: string;
  title?: string;
  tabs?: CodeTab[];
  collapsible?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code = '',
  language = 'typescript',
  title,
  tabs,
  collapsible = false,
}) => {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!collapsible);

  const currentTab = tabs ? tabs[activeTabIdx] : null;
  const currentCode = currentTab ? currentTab.code : code;
  const currentLang = currentTab?.language || language;
  const currentTitle = title || (currentTab ? currentTab.label : undefined);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const lineCount = currentCode.split('\n').length;
  const isLong = lineCount > 24;

  return (
    <div className="rounded-xl border border-white/10 bg-[#07050f] overflow-hidden font-mono text-xs my-4 shadow-lg shadow-black/20">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/8 bg-white/[0.04]">
        <div className="flex items-center gap-2.5">
          {tabs ? (
            <div className="flex items-center gap-1">
              {tabs.map((tab, idx) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTabIdx(idx)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    activeTabIdx === idx
                      ? 'bg-violet-500/20 text-violet-300 font-medium border border-violet-400/25'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : currentTitle ? (
            <div className="flex items-center gap-1.5 text-xs text-white/60 font-medium">
              <IconTerminal size={12} className="text-violet-400 shrink-0" />
              <span className="truncate max-w-[260px]">{currentTitle}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold text-white/30 bg-white/5 border border-white/8">
            {currentLang}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 border border-white/8'
            }`}
            aria-label="Copy code to clipboard"
          >
            {copied ? (
              <>
                <IconCheck size={12} className="text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <IconCopy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <div
        className={`p-4 overflow-x-auto leading-relaxed ${
          isLong && !isExpanded ? 'max-h-[380px] overflow-hidden' : ''
        }`}
      >
        <SyntaxHighlighter code={currentCode} language={currentLang} />
      </div>

      {/* Expand/Collapse Footer for Long Snippets */}
      {isLong && (
        <div className="border-t border-white/8 bg-white/[0.02] px-4 py-2 text-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors cursor-pointer font-medium"
          >
            {isExpanded ? 'Collapse snippet' : `Expand full snippet (${lineCount} lines)`}
          </button>
        </div>
      )}
    </div>
  );
};
