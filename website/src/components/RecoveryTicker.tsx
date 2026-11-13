import React, { useEffect, useState } from 'react';
import { prefersReducedMotion } from './Motion';

/**
 * A looping, illustrative run of the recovery lifecycle shown under the hero code.
 * Each frame is one thing the library does; the active frame advances on a timer.
 */
const FRAMES = [
  { label: 'checkpoint()', detail: 'saved · 412 B · checksum 9f2c1a7e', tone: 'accent' },
  { label: 'app killed', detail: 'memory gone, storage survives', tone: 'danger' },
  { label: 'relaunch', detail: "status: 'checking'", tone: 'muted' },
  { label: 'validated', detail: "checksum ok · not expired · 'available'", tone: 'accent' },
  { label: 'restore()', detail: "status: 'restored' · step 2 of 4", tone: 'accent' },
] as const;

const DOT: Record<string, string> = {
  accent: 'bg-accent',
  danger: 'bg-danger',
  muted: 'bg-fg-subtle',
};

const STEP_MS = 1600;

export const RecoveryTicker: React.FC = () => {
  const reduced = prefersReducedMotion();
  const [active, setActive] = useState(reduced ? FRAMES.length - 1 : 0);

  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setActive((i) => (i + 1) % FRAMES.length), STEP_MS);
    return () => window.clearInterval(t);
  }, [reduced]);

  const frame = FRAMES[active];

  return (
    <div className="rounded-lg border border-line bg-elev/80 px-4 py-3 backdrop-blur" aria-hidden="true">
      <div className="flex items-center gap-1.5">
        {FRAMES.map((f, i) => (
          <span key={f.label} className="relative h-1 flex-1 overflow-hidden rounded-full bg-line">
            <span
              className={`absolute inset-y-0 left-0 rounded-full ${DOT[f.tone]} ${
                i < active ? 'w-full' : i === active ? 'ticker-fill' : 'w-0'
              }`}
              style={i === active ? ({ '--ticker-ms': `${STEP_MS}ms` } as React.CSSProperties) : undefined}
            />
          </span>
        ))}
      </div>
      <div key={active} className="anim-ticker mt-2.5 flex min-w-0 items-center gap-2.5 font-mono text-[0.8125rem]">
        <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[frame.tone]} ${frame.tone === 'accent' ? 'shadow-[0_0_0_4px_var(--accent-soft)]' : ''}`} />
        <span className="shrink-0 text-fg">{frame.label}</span>
        <span className="truncate text-fg-subtle">{frame.detail}</span>
      </div>
    </div>
  );
};
