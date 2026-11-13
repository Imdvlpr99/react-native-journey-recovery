import React from 'react';

/** Mark: a path that loops back to a checkpoint. */
export const LogoMark: React.FC<{ size?: number; className?: string }> = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <rect x="0.75" y="0.75" width="22.5" height="22.5" rx="6" className="fill-fg" />
    <path
      d="M7.5 15.5a5 5 0 1 0 1.2-6.3"
      className="stroke-bg"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M7 6.5v3.2h3.2" className="stroke-bg" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="12.5" cy="12" r="1.6" className="fill-accent-strong" />
  </svg>
);
