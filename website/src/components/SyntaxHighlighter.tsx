import React from 'react';

interface SyntaxHighlighterProps {
  code: string;
  language?: string;
}

export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({ code, language = 'typescript' }) => {
  const lines = code.split('\n');

  const tokenizeLine = (line: string, lang: string): React.ReactNode[] => {
    if (!line) return [' '];

    // Single-line comments (# in bash, // in js/ts)
    if (lang === 'bash' && line.trim().startsWith('#')) {
      return [<span key="comment" className="text-slate-500 italic">{line}</span>];
    }
    if ((lang === 'typescript' || lang === 'tsx' || lang === 'javascript') && line.trim().startsWith('//')) {
      return [<span key="comment" className="text-slate-500 italic">{line}</span>];
    }

    const tokenRegex = /(\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b0x[a-fA-F0-9]+\b|\b\d+(?:\.\d+)?\b)|([a-zA-Z_$][a-zA-Z0-9_$]*)|([{}()[\];,.:<>?!=+\-*/&|~^%]+)|(\s+)/g;

    const keywords = new Set([
      'import', 'export', 'from', 'default', 'const', 'let', 'var', 'function',
      'return', 'async', 'await', 'new', 'if', 'else', 'for', 'while', 'switch',
      'case', 'break', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof',
      'type', 'interface', 'class', 'extends', 'implements', 'as', 'keyof', 'readonly',
      'npm', 'npx', 'pnpm', 'yarn', 'expo', 'add', 'install', 'run'
    ]);

    const builtins = new Set([
      'true', 'false', 'null', 'undefined', 'void', 'string', 'number', 'boolean', 'any',
      'unknown', 'never', 'Promise', 'Record', 'Array', 'Set', 'Map', 'Date', 'JSON',
      'RecoveryProvider', 'AsyncStorageAdapter', 'MMKVStorageAdapter', 'SecureStoreAdapter',
      'MemoryStorageAdapter', 'useJourney', 'useRecovery', 'useJourneyForm', 'useJourneyFormik',
      'useJourneyZustand', 'useJourneyRedux', 'useJourneyQuery', 'RecoveryBanner', 'RecoveryModal',
      'RecoveryBottomSheet', 'CheckpointManager', 'SnapshotValidator', 'createZodValidator',
      'createNavigationAdapter', 'createExpoRouterAdapter', 'computeChecksum', 'inspectSnapshot'
    ]);

    const elements: React.ReactNode[] = [];
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(line)) !== null) {
      const [, comment, stringVal, numberVal, wordVal, symbolVal, spaceVal] = match;

      if (comment) {
        elements.push(<span key={match.index} className="text-slate-500 italic">{comment}</span>);
      } else if (stringVal) {
        elements.push(<span key={match.index} className="text-emerald-400">{stringVal}</span>);
      } else if (numberVal) {
        elements.push(<span key={match.index} className="text-purple-400">{numberVal}</span>);
      } else if (wordVal) {
        if (keywords.has(wordVal)) {
          elements.push(<span key={match.index} className="text-rose-400 font-semibold">{wordVal}</span>);
        } else if (builtins.has(wordVal)) {
          elements.push(<span key={match.index} className="text-cyan-400 font-semibold">{wordVal}</span>);
        } else if (wordVal.startsWith('use') || /^[A-Z]/.test(wordVal)) {
          elements.push(<span key={match.index} className="text-sky-400 font-semibold">{wordVal}</span>);
        } else {
          elements.push(<span key={match.index} className="text-slate-200">{wordVal}</span>);
        }
      } else if (symbolVal) {
        elements.push(<span key={match.index} className="text-slate-400">{symbolVal}</span>);
      } else if (spaceVal) {
        elements.push(spaceVal);
      }
    }

    if (elements.length === 0) {
      elements.push(line);
    }

    return elements;
  };

  return (
    <div className="font-mono text-xs space-y-0.5">
      {lines.map((line, idx) => (
        <div key={idx} className="flex hover:bg-slate-900/50 -mx-4 px-4 py-0.5 transition-colors">
          <span className="w-8 shrink-0 text-slate-600 select-none text-right pr-4 text-[11px]">
            {idx + 1}
          </span>
          <span className="flex-1 whitespace-pre">{tokenizeLine(line, language)}</span>
        </div>
      ))}
    </div>
  );
};
