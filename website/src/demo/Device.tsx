import React, { useEffect, useState } from 'react';

/* ------------------------------------------------------------------
   Phone mockup
   A generic modern smartphone: titanium edge, side buttons, floating
   camera island, status bar and home indicator. The screen is a
   positioned box, so whatever renders inside behaves like a full app.
   ------------------------------------------------------------------ */

type Appearance = 'light' | 'dark';

const STATUS_BAR_H = 'h-[46px]';

function useClock(): string {
  const format = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '');
  const [time, setTime] = useState(format);
  useEffect(() => {
    const t = window.setInterval(() => setTime(format()), 15_000);
    return () => window.clearInterval(t);
  }, []);
  return time;
}

const SignalIcon = () => (
  <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden="true">
    <rect x="0" y="7" width="3" height="4" rx="0.8" />
    <rect x="4.5" y="5" width="3" height="6" rx="0.8" />
    <rect x="9" y="2.5" width="3" height="8.5" rx="0.8" />
    <rect x="13.5" y="0" width="3" height="11" rx="0.8" />
  </svg>
);

const WifiIcon = () => (
  <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor" aria-hidden="true">
    <path d="M7.5 2.2c2.1 0 4 .8 5.5 2.1l1.2-1.2A9.4 9.4 0 0 0 7.5.5 9.4 9.4 0 0 0 .8 3.1L2 4.3a7.7 7.7 0 0 1 5.5-2.1Z" />
    <path d="M7.5 5.5c1.2 0 2.3.4 3.2 1.2l1.2-1.2a6.3 6.3 0 0 0-8.8 0l1.2 1.2c.9-.8 2-1.2 3.2-1.2Z" />
    <path d="M7.5 8.6c.4 0 .8.2 1.1.4L7.5 10.3 6.4 9c.3-.2.7-.4 1.1-.4Z" />
  </svg>
);

const BatteryIcon = () => (
  <svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden="true">
    <rect x="0.5" y="0.5" width="22" height="11" rx="3.2" stroke="currentColor" opacity="0.4" />
    <rect x="2" y="2" width="16" height="8" rx="1.8" fill="currentColor" />
    <path d="M24 4v4c.8-.3 1.3-1.1 1.3-2S24.8 4.3 24 4Z" fill="currentColor" opacity="0.45" />
  </svg>
);

const StatusBar: React.FC<{ appearance: Appearance }> = ({ appearance }) => {
  const time = useClock();
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex ${STATUS_BAR_H} items-center justify-between px-7 pt-1 font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-[14px] font-semibold tracking-tight transition-colors duration-300 ${
        appearance === 'dark' ? 'text-white' : 'text-[#0b0f17]'
      }`}
    >
      <span className="w-14 tabular-nums">{time}</span>
      <span className="flex w-14 items-center justify-end gap-[5px]">
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </span>
    </div>
  );
};

export const Phone: React.FC<{ appearance: Appearance; screenBg: string; children: React.ReactNode }> = ({
  appearance,
  screenBg,
  children,
}) => (
  <div className="relative mx-auto w-full max-w-[372px]">
    {/* Side buttons */}
    <span aria-hidden="true" className="absolute -left-[2px] top-[18%] hidden h-7 w-[3px] rounded-l-sm bg-gradient-to-r from-[#4a505a] to-[#2a2e35] sm:block" />
    <span aria-hidden="true" className="absolute -left-[2px] top-[25%] hidden h-12 w-[3px] rounded-l-sm bg-gradient-to-r from-[#4a505a] to-[#2a2e35] sm:block" />
    <span aria-hidden="true" className="absolute -left-[2px] top-[33%] hidden h-12 w-[3px] rounded-l-sm bg-gradient-to-r from-[#4a505a] to-[#2a2e35] sm:block" />
    <span aria-hidden="true" className="absolute -right-[2px] top-[28%] hidden h-[4.5rem] w-[3px] rounded-r-sm bg-gradient-to-l from-[#4a505a] to-[#2a2e35] sm:block" />

    {/* Titanium edge */}
    <div className="rounded-[3.4rem] bg-gradient-to-br from-[#5b616b] via-[#24272d] to-[#4b515a] p-[2px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.04)]">
      {/* Bezel */}
      <div className="rounded-[3.3rem] bg-[#050608] p-[11px] ring-1 ring-inset ring-white/[0.06]">
        {/* Screen */}
        <div
          className="relative isolate flex h-[clamp(600px,78vh,760px)] flex-col overflow-hidden rounded-[2.65rem] transition-colors duration-300"
          style={{ background: screenBg }}
        >
          <StatusBar appearance={appearance} />

          {/* Camera island */}
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[11px] z-30 flex h-[30px] w-[104px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-3">
            <span className="h-[9px] w-[9px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#2b3a55,#0a0d14_70%)] ring-1 ring-white/5" />
          </div>

          {/* App area, below the status bar and above the home indicator */}
          <div className="flex min-h-0 flex-1 flex-col pb-[22px] pt-[46px]">{children}</div>

          {/* Home indicator */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-[22px] items-center justify-center">
            <span className={`h-[5px] w-[132px] rounded-full transition-colors duration-300 ${appearance === 'dark' ? 'bg-white/85' : 'bg-[#0b0f17]/85'}`} />
          </div>

          {/* Glass sheen */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-40 rounded-[2.65rem] bg-[linear-gradient(115deg,rgba(255,255,255,0.07)_0%,transparent_28%)]" />
        </div>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------
   Home screen, shown while the app is "killed"
   ------------------------------------------------------------------ */

export const HOME_WALLPAPER =
  'radial-gradient(120% 70% at 15% 0%, #1d4d3a 0%, transparent 60%), radial-gradient(90% 60% at 100% 100%, #1e3a5f 0%, transparent 60%), linear-gradient(180deg, #0c1220 0%, #0a0f1a 100%)';

const OTHER_APPS = [
  { label: 'Mail', tint: '#3b82f6' },
  { label: 'Maps', tint: '#22c55e' },
  { label: 'Photos', tint: '#f59e0b' },
  { label: 'Notes', tint: '#eab308' },
  { label: 'Music', tint: '#ef4444' },
  { label: 'Wallet', tint: '#64748b' },
  { label: 'Weather', tint: '#0ea5e9' },
];

const DOCK = ['#22c55e', '#3b82f6', '#a855f7', '#f97316'];

const BagGlyph = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 7h12l-1 13H7L6 7Z" />
    <path d="M9 9V6a3 3 0 0 1 6 0v3" />
  </svg>
);

const AppIcon: React.FC<{ tint: string; label?: string; children?: React.ReactNode }> = ({ tint, label, children }) => (
  <span className="flex flex-col items-center gap-1.5">
    <span
      className="flex h-[54px] w-[54px] items-center justify-center rounded-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_12px_-4px_rgba(0,0,0,0.5)]"
      style={{ background: `linear-gradient(160deg, ${tint}, color-mix(in srgb, ${tint} 70%, black))` }}
    >
      {children ?? <span className="h-5 w-5 rounded-md bg-white/35" />}
    </span>
    {label && <span className="text-[11px] font-medium text-white/85">{label}</span>}
  </span>
);

export const HomeScreen: React.FC<{ onOpen: () => void }> = ({ onOpen }) => (
  <div className="anim-fade flex flex-1 flex-col px-5 pt-6">
    <div className="grid grid-cols-4 gap-x-3 gap-y-5">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open the checkout app"
        className="group relative flex flex-col items-center gap-1.5 rounded-2xl outline-offset-4"
      >
        <span className="absolute top-0 h-[54px] w-[54px] animate-ping rounded-[15px] bg-[#22c55e]/40 [animation-duration:1.8s]" aria-hidden="true" />
        <span className="relative transition-transform duration-150 group-hover:scale-105 group-active:scale-95">
          <AppIcon tint="#16a34a">
            <BagGlyph />
          </AppIcon>
        </span>
        <span className="text-[11px] font-medium text-white">Checkout</span>
      </button>
      {OTHER_APPS.map((app) => (
        <span key={app.label} aria-hidden="true" className="opacity-80">
          <AppIcon tint={app.tint} label={app.label} />
        </span>
      ))}
    </div>

    <div className="mt-auto pb-3">
      <p className="mx-auto mb-4 max-w-[15.5rem] rounded-2xl bg-white/10 px-4 py-3 text-center text-[12px] leading-relaxed text-white/80 backdrop-blur-md">
        The app was killed and its memory is gone. Only storage survived. Tap <strong className="font-semibold text-white">Checkout</strong> to open it again.
      </p>
      <div aria-hidden="true" className="flex justify-between rounded-[28px] bg-white/10 px-4 py-3 backdrop-blur-md">
        {DOCK.map((tint) => (
          <AppIcon key={tint} tint={tint} />
        ))}
      </div>
    </div>
  </div>
);

/** Wraps a freshly launched app with a short zoom-in, like opening it from the home screen. */
export const LaunchTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="anim-app-open flex min-h-0 flex-1 flex-col">{children}</div>
);
