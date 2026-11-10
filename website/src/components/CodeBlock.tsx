import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'typescript', title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div style={{
      background: 'var(--code-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      marginBlock: '16px 24px',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        background: '#0d1322',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ inlineSize: '10px', blockSize: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ inlineSize: '10px', blockSize: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ inlineSize: '10px', blockSize: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          </div>
          {title && <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginInlineStart: '8px' }}>{title}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: '0.5px',
          }}>
            {language}
          </span>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
              border: copied ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid transparent',
              color: copied ? 'var(--accent-emerald)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: '6px',
              transition: 'all 0.15s',
            }}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <pre style={{
        padding: '16px',
        overflowX: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        lineHeight: 1.6,
        color: '#e2e8f0',
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
};

