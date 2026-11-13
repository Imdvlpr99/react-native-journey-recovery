import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActiveTab } from './Navbar';
import { CodeBlock } from './CodeBlock';
import {
  IconCopy, IconCheck, IconShield, IconZap,
  IconDatabase, IconLayers, IconChevronRight, IconLock, IconGithub,
} from './Icons';

interface LandingPageProps {
  onNavigate: (tab: ActiveTab, sectionId?: string) => void;
  onOpenSearch: () => void;
}

/* ─── Hero Visualization ───────────────────────────────────────── */
type VisPhase = 'filling' | 'checkpoint' | 'interrupted' | 'recovering' | 'restored';

const PhoneScreen: React.FC<{ phase: VisPhase }> = ({ phase }) => {
  const isBlurred = phase === 'interrupted';
  const isRecovering = phase === 'recovering';
  const isRestored = phase === 'restored';

  return (
    <div className="relative w-[260px] rounded-[2rem] overflow-hidden border border-white/12 bg-[#0D1120] shadow-2xl shadow-black/60 select-none">
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <span className="text-[10px] font-medium text-white/40">9:41</span>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">{[3,2,2,1].map((h,i) => <div key={i} className={`w-[2px] rounded-full bg-white/${h === 3 ? '50' : h === 1 ? '20' : '35'}`} style={{height: `${3+h*2}px`}} />)}</div>
          <div className="w-5 h-2.5 rounded-sm border border-white/25 relative"><div className="absolute left-0.5 top-0.5 bottom-0.5 rounded-[1px] bg-white/40 w-3/4" /></div>
        </div>
      </div>

      {/* App header */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] transition-all duration-500 ${isBlurred ? 'opacity-30 blur-sm' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#22C7F2]/15 border border-[#22C7F2]/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#22C7F2]" />
          </div>
          <span className="text-xs font-semibold text-white/80">Checkout</span>
        </div>
        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {[1,2,3].map(n => (
            <div key={n} className={`rounded-full transition-all duration-300 ${n <= 2 ? 'w-2 h-2 bg-[#22C7F2]' : 'w-1.5 h-1.5 bg-white/15'}`} />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className={`px-4 pt-3 transition-all duration-500 ${isBlurred ? 'opacity-20 blur-sm' : ''}`}>
        <div className="h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${isRestored ? 'bg-[#22C7F2] w-2/3' : 'bg-[#22C7F2] w-2/3'}`} />
        </div>
        <p className="text-[9px] text-white/25 mt-1">Step 2 of 3</p>
      </div>

      {/* Form fields */}
      <div className={`px-4 pt-3 pb-4 space-y-3 transition-all duration-500 ${isBlurred ? 'opacity-20 blur-sm' : ''}`}>
        {/* Success banner */}
        {isRestored && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#22C7F2]/10 border border-[#22C7F2]/20 animate-slide-down">
            <div className="w-3.5 h-3.5 rounded-full bg-[#22C7F2]/20 flex items-center justify-center shrink-0">
              <IconCheck size={8} className="text-[#22C7F2]" />
            </div>
            <span className="text-[9px] font-semibold text-[#22C7F2]">Journey Restored</span>
          </div>
        )}

        <div>
          <p className="text-[9px] text-white/35 mb-1 font-medium">First Name</p>
          <div className={`h-7 rounded-lg px-2.5 flex items-center text-[10px] font-medium transition-all duration-500 ${
            isRestored
              ? 'bg-[#22C7F2]/8 border border-[#22C7F2]/20 text-[#22C7F2]/90'
              : 'bg-white/[0.04] border border-white/[0.06] text-white/70'
          }`}>
            Alex
            {isRestored && <IconCheck size={8} className="ml-auto text-[#22C7F2]" />}
          </div>
        </div>

        <div>
          <p className="text-[9px] text-white/35 mb-1 font-medium">Last Name</p>
          <div className={`h-7 rounded-lg px-2.5 flex items-center text-[10px] font-medium transition-all duration-500 ${
            isRestored
              ? 'bg-[#22C7F2]/8 border border-[#22C7F2]/20 text-[#22C7F2]/90'
              : 'bg-white/[0.04] border border-white/[0.06] text-white/70'
          }`}>
            Johnson
            {isRestored && <IconCheck size={8} className="ml-auto text-[#22C7F2]" />}
          </div>
        </div>

        <div>
          <p className="text-[9px] text-white/35 mb-1 font-medium">Email Address</p>
          <div className={`h-7 rounded-lg px-2.5 flex items-center text-[10px] font-medium transition-all duration-500 ${
            isRestored
              ? 'bg-[#22C7F2]/8 border border-[#22C7F2]/20 text-[#22C7F2]/90'
              : 'bg-white/[0.04] border border-white/[0.06] text-white/70'
          }`}>
            <span className="truncate">alex@company.com</span>
            {isRestored && <IconCheck size={8} className="ml-auto text-[#22C7F2] shrink-0" />}
          </div>
        </div>

        <div className={`h-8 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-semibold transition-all duration-300 ${
          isRestored
            ? 'bg-[#22C7F2] text-[#090B14]'
            : 'bg-white/8 text-white/50'
        }`}>
          Continue
          <IconChevronRight size={9} />
        </div>
      </div>

      {/* Checkpoint toast */}
      {phase === 'checkpoint' && (
        <div className="absolute bottom-4 left-3 right-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111827] border border-white/10 animate-slide-down shadow-lg">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <IconCheck size={8} className="text-emerald-400" />
          </div>
          <span className="text-[9px] font-medium text-emerald-300">Checkpoint saved</span>
          <span className="text-[8px] text-white/25 ml-auto font-mono">step:2</span>
        </div>
      )}

      {/* Interrupted overlay */}
      {phase === 'interrupted' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#090B14]/90 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center">
            <IconZap size={18} className="text-red-400" />
          </div>
          <div className="text-center px-4">
            <p className="text-xs font-semibold text-white/80">App Interrupted</p>
            <p className="text-[9px] text-white/35 mt-0.5">Background terminated</p>
          </div>
          <p className="text-[9px] text-white/30 px-4 text-center">Your checkpoint was saved automatically.</p>
          <div className="mt-1 h-7 w-32 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-semibold bg-[#22C7F2]/15 border border-[#22C7F2]/25 text-[#22C7F2]">
            ↺ Restore Session
          </div>
        </div>
      )}

      {/* Recovering overlay */}
      {phase === 'recovering' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#090B14]/90">
          <div className="w-8 h-8 rounded-full border-2 border-[#22C7F2]/20 border-t-[#22C7F2] animate-spin-slow" />
          <p className="text-[10px] font-medium text-[#22C7F2]/80">Restoring journey…</p>
        </div>
      )}
    </div>
  );
};

const HeroVisualization: React.FC = () => {
  const [phase, setPhase] = useState<VisPhase>('filling');

  useEffect(() => {
    const seq: Array<[VisPhase, number]> = [
      ['filling', 2800],
      ['checkpoint', 1200],
      ['filling', 1200],
      ['interrupted', 2200],
      ['recovering', 1800],
      ['restored', 2800],
    ];
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      i = (i + 1) % seq.length;
      setPhase(seq[i][0]);
      t = setTimeout(tick, seq[i][1]);
    };
    t = setTimeout(tick, seq[0][1]);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative flex justify-center items-center py-6">
      {/* Glow behind phone */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#22C7F2]/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-[#873DF5]/[0.06] blur-3xl pointer-events-none translate-x-12" />
      <PhoneScreen phase={phase} />

      {/* Phase label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {(['filling', 'checkpoint', 'interrupted', 'recovering', 'restored'] as VisPhase[]).map((p) => (
          <div key={p} className={`rounded-full transition-all duration-300 ${p === phase ? 'w-3 h-1.5 bg-[#22C7F2]' : 'w-1.5 h-1.5 bg-white/15'}`} />
        ))}
      </div>
    </div>
  );
};

/* ─── Journey Simulator ─────────────────────────────────────────── */
interface SimLogEntry { id: string; type: 'success' | 'error' | 'warning' | 'info'; msg: string; detail?: string; }
type SimPhase = 'idle' | 'filling' | 'interrupted' | 'recovering' | 'recovered';

const JourneySimulator: React.FC = () => {
  const [phase, setPhase] = useState<SimPhase>('filling');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [savedForm, setSavedForm] = useState<typeof form | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [log, setLog] = useState<SimLogEntry[]>([
    { id: '0', type: 'info', msg: 'Journey initialized', detail: 'journeyId: checkout-flow' },
  ]);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((entry: Omit<SimLogEntry, 'id'>) => {
    setLog(l => [...l, { ...entry, id: String(Date.now() + Math.random()) }]);
    setTimeout(() => logRef.current?.scrollTo({ top: 999, behavior: 'smooth' }), 50);
  }, []);

  const handleFieldChange = (field: keyof typeof form, value: string) => {
    if (phase !== 'filling') return;
    setForm(f => ({ ...f, [field]: value }));
    if (value.length > 0 && value.length % 3 === 0) {
      addLog({ type: 'info', msg: 'Auto-checkpoint', detail: `step:1 · ${Object.values({ ...form, [field]: value }).filter(Boolean).length} fields` });
    }
  };

  const handleSave = () => {
    if (phase !== 'filling') return;
    const count = Object.values(form).filter(Boolean).length;
    if (count === 0) { addLog({ type: 'warning', msg: 'Nothing to save', detail: 'Fill at least one field' }); return; }
    setSavedForm({ ...form });
    setHasSaved(true);
    addLog({ type: 'success', msg: 'Checkpoint saved', detail: `step:1 · ${count} fields · FNV-1a: 0x3F2A1B8C` });
  };

  const handleInterrupt = () => {
    if (phase !== 'filling') return;
    if (!hasSaved) { addLog({ type: 'warning', msg: 'No checkpoint', detail: 'Save a checkpoint first' }); return; }
    setPhase('interrupted');
    addLog({ type: 'error', msg: 'App background-killed', detail: 'OS: LMK · jetsam · pid terminated' });
  };

  const handleRestore = () => {
    if (phase !== 'interrupted') return;
    setPhase('recovering');
    addLog({ type: 'info', msg: 'Restoring journey…', detail: 'Loading from MMKV storage' });
    setTimeout(() => {
      setForm(savedForm!);
      setPhase('recovered');
      addLog({ type: 'success', msg: 'Journey restored', detail: `${Object.values(savedForm!).filter(Boolean).length} fields recovered` });
    }, 1800);
  };

  const handleReset = () => {
    setPhase('filling');
    setForm({ firstName: '', lastName: '', email: '' });
    setSavedForm(null);
    setHasSaved(false);
    setLog([{ id: '0', type: 'info', msg: 'Journey initialized', detail: 'journeyId: checkout-flow' }]);
  };

  const isDisabled = phase !== 'filling';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Phone simulation card */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0D1120] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22C7F2] animate-pulse-glow" />
            <span className="text-xs font-semibold text-white/70">Mobile App — Checkout Flow</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
            phase === 'interrupted' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
            phase === 'recovering' ? 'bg-[#22C7F2]/10 text-[#22C7F2] border border-[#22C7F2]/20' :
            phase === 'recovered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            'bg-white/[0.04] text-white/30 border border-white/[0.06]'
          }`}>
            {phase === 'interrupted' ? '⚡ INTERRUPTED' : phase === 'recovering' ? '↺ RECOVERING' : phase === 'recovered' ? '✓ RECOVERED' : '● RUNNING'}
          </span>
        </div>

        <div className="p-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-5">
            {[1,2,3].map(n => (
              <React.Fragment key={n}>
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-colors ${n === 1 ? 'bg-[#22C7F2] text-[#090B14]' : 'bg-white/[0.06] text-white/25'}`}>
                  {phase === 'recovered' && n === 1 ? <IconCheck size={10} /> : n}
                </div>
                {n < 3 && <div className={`flex-1 h-px transition-colors ${n === 1 && phase === 'recovered' ? 'bg-[#22C7F2]/30' : 'bg-white/[0.06]'}`} />}
              </React.Fragment>
            ))}
            <span className="text-[10px] text-white/30 ml-1 font-mono">step 1 of 3</span>
          </div>

          {/* Recovery/Interrupt overlays */}
          {phase === 'interrupted' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <IconZap size={22} className="text-red-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white/80">App Interrupted</p>
                <p className="text-xs text-white/35 mt-1">Background process terminated by OS</p>
              </div>
              <button
                onClick={handleRestore}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#22C7F2] text-[#090B14] hover:bg-[#3ACFEF] transition-colors cursor-pointer shadow-[0_0_20px_rgba(34,199,242,0.25)]"
              >
                ↺ Restore Session
              </button>
            </div>
          )}

          {phase === 'recovering' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-10 h-10 rounded-full border-2 border-[#22C7F2]/20 border-t-[#22C7F2] animate-spin-slow" />
              <p className="text-sm text-[#22C7F2]/80 font-medium">Restoring your journey…</p>
              <p className="text-xs text-white/30">Reading checkpoint from storage</p>
            </div>
          )}

          {(phase === 'filling' || phase === 'recovered') && (
            <div className="space-y-3">
              {phase === 'recovered' && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#22C7F2]/8 border border-[#22C7F2]/20 mb-4">
                  <IconCheck size={14} className="text-[#22C7F2] shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[#22C7F2]">Journey Restored</p>
                    <p className="text-[10px] text-[#22C7F2]/60">Your progress was recovered automatically</p>
                  </div>
                </div>
              )}

              {(['firstName', 'lastName', 'email'] as const).map((field) => (
                <div key={field}>
                  <label className="text-[11px] font-medium text-white/40 block mb-1.5 capitalize">
                    {field === 'firstName' ? 'First Name' : field === 'lastName' ? 'Last Name' : 'Email Address'}
                  </label>
                  <div className={`flex items-center rounded-xl border px-3 h-10 transition-all ${
                    phase === 'recovered'
                      ? 'bg-[#22C7F2]/6 border-[#22C7F2]/20'
                      : 'bg-white/[0.03] border-white/[0.07] focus-within:border-[#22C7F2]/30'
                  }`}>
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      value={form[field]}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      disabled={isDisabled}
                      placeholder={field === 'firstName' ? 'Alex' : field === 'lastName' ? 'Johnson' : 'alex@example.com'}
                      className="flex-1 bg-transparent text-xs text-white/80 placeholder-white/20 outline-none disabled:cursor-not-allowed"
                    />
                    {phase === 'recovered' && form[field] && (
                      <IconCheck size={12} className="text-[#22C7F2] shrink-0" />
                    )}
                  </div>
                </div>
              ))}

              {/* Action buttons */}
              {phase === 'filling' && (
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 h-9 rounded-xl text-xs font-semibold border border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.07] hover:text-white transition-all cursor-pointer"
                  >
                    ✓ Save Checkpoint
                  </button>
                  <button
                    onClick={handleInterrupt}
                    className={`flex-1 h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      hasSaved
                        ? 'border border-red-500/20 bg-red-500/8 text-red-400 hover:bg-red-500/15'
                        : 'border border-white/[0.06] bg-white/[0.02] text-white/20 cursor-not-allowed'
                    }`}
                    disabled={!hasSaved}
                  >
                    ⚡ Interrupt App
                  </button>
                </div>
              )}

              {phase === 'recovered' && (
                <div className="flex gap-2.5 pt-2">
                  <button
                    className="flex-1 h-9 rounded-xl text-xs font-semibold bg-[#22C7F2] text-[#090B14] hover:bg-[#3ACFEF] transition-all cursor-pointer"
                  >
                    Continue →
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 h-9 rounded-xl text-xs font-medium border border-white/[0.07] text-white/40 hover:text-white transition-all cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recovery log */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0D1120] overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] shrink-0">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
          </div>
          <span className="text-xs font-semibold text-white/40 font-mono ml-1">journey-recovery · engine log</span>
        </div>

        <div ref={logRef} className="flex-1 p-4 overflow-y-auto max-h-[320px] space-y-2 font-mono text-[11px]">
          {log.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 animate-fade-in">
              <span className={`shrink-0 mt-0.5 ${
                entry.type === 'success' ? 'text-emerald-400' :
                entry.type === 'error' ? 'text-red-400' :
                entry.type === 'warning' ? 'text-amber-400' :
                'text-[#22C7F2]/60'
              }`}>
                {entry.type === 'success' ? '✓' : entry.type === 'error' ? '✗' : entry.type === 'warning' ? '⚠' : '●'}
              </span>
              <div className="min-w-0">
                <span className={`font-semibold ${
                  entry.type === 'success' ? 'text-emerald-300' :
                  entry.type === 'error' ? 'text-red-300' :
                  entry.type === 'warning' ? 'text-amber-300' :
                  'text-white/60'
                }`}>{entry.msg}</span>
                {entry.detail && <span className="ml-2 text-white/25">{entry.detail}</span>}
              </div>
            </div>
          ))}
          {phase === 'filling' && log.length === 1 && (
            <p className="text-white/15 pl-4">Fill the form and save a checkpoint...</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── FAQ Accordion ─────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: 'What problem does RN Journey Recovery solve?',
    a: "Mobile OS's forcefully kill background processes (iOS Jetsam, Android LMK) without warning. This destroys in-progress multi-step flows — checkout forms, onboarding wizards, KYC verification. RN Journey Recovery checkpoints your journey state automatically so users can seamlessly resume exactly where they left off when they return.",
  },
  {
    q: 'How does recovery actually work?',
    a: "The library doesn't detect app kills — it doesn't have to. During normal use it continuously checkpoints your journey state to persistent storage. When the app relaunches, it checks for existing checkpoints and presents a recovery banner. The absence of a clean shutdown is itself the recovery signal.",
  },
  {
    q: 'Does it work with both Expo and bare React Native?',
    a: 'Yes. Use createAsyncStorageAdapter for maximum compatibility in both managed and bare workflows. For high-performance bare React Native apps, createMMKVAdapter offers C++ write speeds under 0.05ms.',
  },
  {
    q: 'How do I exclude sensitive fields like passwords or CVV?',
    a: "Pass an exclude array to journey.checkpoint(): journey.checkpoint(formData, { exclude: ['password', 'cvv', 'cardNumber'] }). These fields are stripped before serialization and never reach storage. Combined with SecureStore adapter, you get hardware-backed encryption for the remaining data.",
  },
  {
    q: 'What happens to journeys that expire?',
    a: "Journeys have a TTL (time-to-live) set in RecoveryProvider (default: configurable). Expired journeys are silently skipped during recovery — the user gets a fresh start with no error. You can also set per-journey TTL overrides for flows requiring shorter expiry windows.",
  },
  {
    q: 'Can I use a custom storage backend?',
    a: 'Yes. The library uses a pluggable adapter pattern. Built-in: AsyncStorage, MMKV, Expo SecureStore, and an in-memory adapter for testing. Implement the StorageAdapter interface (read, write, remove, clear) to integrate any storage solution.',
  },
  {
    q: 'Is TypeScript fully supported?',
    a: 'Complete TypeScript strict support with comprehensive type definitions including generics. Use useJourney<CheckoutFormData>("checkout-flow", options) to get full type inference on checkpoint() and restore() methods, ensuring your payload types match across the recovery lifecycle.',
  },
];

const FAQItem: React.FC<{ q: string; a: string; open: boolean; onToggle: () => void }> = ({ q, a, open, onToggle }) => (
  <div className={`border rounded-xl transition-colors overflow-hidden ${open ? 'border-white/12' : 'border-white/[0.06]'}`}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left cursor-pointer group"
    >
      <span className={`text-sm font-medium transition-colors ${open ? 'text-white' : 'text-white/65 group-hover:text-white/85'}`}>{q}</span>
      <span className={`mt-0.5 shrink-0 text-sm transition-transform duration-200 ${open ? 'rotate-45 text-[#22C7F2]' : 'text-white/25'}`}>+</span>
    </button>
    {open && (
      <div className="px-5 pb-4 animate-fade-in">
        <p className="text-sm text-white/50 leading-relaxed">{a}</p>
      </div>
    )}
  </div>
);

/* ─── Code examples data ────────────────────────────────────────── */
const CODE_TABS = {
  install: {
    label: 'Install',
    language: 'bash',
    code: `# npm
npm install react-native-journey-recovery

# Expo (auto-links native deps)
npx expo install react-native-journey-recovery

# pnpm
pnpm add react-native-journey-recovery`,
  },
  setup: {
    label: 'Setup',
    language: 'tsx',
    code: `import { RecoveryProvider } from 'react-native-journey-recovery';
import { createAsyncStorageAdapter } from 'react-native-journey-recovery/adapters';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create your storage adapter once
const adapter = createAsyncStorageAdapter(AsyncStorage);

export default function App() {
  return (
    <RecoveryProvider
      adapter={adapter}
      ttl={24 * 60 * 60 * 1000} // 24-hour expiry
    >
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </RecoveryProvider>
  );
}`,
  },
  checkpoint: {
    label: 'Checkpoint',
    language: 'tsx',
    code: `import { useJourney } from 'react-native-journey-recovery';

function CheckoutScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', address: '' });

  // Bind this screen to a named journey
  const journey = useJourney('checkout-flow', {
    version: 1,
    autoSave: true,     // checkpoint on every change
    debounceMs: 400,    // debounce rapid keypresses
  });

  const handleNext = async () => {
    // Persist state — sensitive fields are stripped
    await journey.checkpoint(form, {
      exclude: ['cvv', 'cardNumber'],
    });
    navigation.navigate('Payment');
  };

  return (/* your checkout form */);
}`,
  },
  recovery: {
    label: 'Recovery',
    language: 'tsx',
    code: `import { RecoveryBanner } from 'react-native-journey-recovery';

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Drop in anywhere — shows only when a checkpoint exists */}
      <RecoveryBanner
        journeyId="checkout-flow"
        onRestore={(savedData) => {
          navigation.navigate('Checkout', {
            recoveredData: savedData,
          });
        }}
        onDismiss={async ({ clear }) => {
          await clear(); // remove the checkpoint
        }}
      />
      {/* ... rest of HomeScreen */}
    </View>
  );
}`,
  },
};

/* ─── Integrations data ─────────────────────────────────────────── */
const INTEGRATIONS = [
  { name: 'React Native', category: 'Core Runtime', desc: 'Full compatibility with both Expo and bare workflows', color: '#22C7F2' },
  { name: 'Expo', category: 'Managed Workflow', desc: 'expo install support and managed workflow ready', color: '#873DF5' },
  { name: 'MMKV', category: 'Storage Adapter', desc: 'C++ synchronous writes under 0.05ms', color: '#22C7F2' },
  { name: 'AsyncStorage', category: 'Storage Adapter', desc: 'Default async adapter, Expo-compatible', color: '#873DF5' },
  { name: 'Expo SecureStore', category: 'Storage Adapter', desc: 'Hardware-backed keychain encryption', color: '#22C7F2' },
  { name: 'React Navigation', category: 'Navigation', desc: 'Stack and tab state recovery support', color: '#873DF5' },
  { name: 'Expo Router', category: 'Navigation', desc: 'File-based routing integration', color: '#22C7F2' },
  { name: 'React Hook Form', category: 'Form Library', desc: 'Field-level sync via useForm integration', color: '#873DF5' },
  { name: 'Formik', category: 'Form Library', desc: 'setValues-based restoration support', color: '#22C7F2' },
  { name: 'Zod', category: 'Validation', desc: 'Schema validation on checkpoint restore', color: '#873DF5' },
];

/* ─── Main LandingPage ──────────────────────────────────────────── */
export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [copied, setCopied] = useState(false);
  const [codeTab, setCodeTab] = useState<keyof typeof CODE_TABS>('install');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('npm install react-native-journey-recovery');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Scroll-reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in-view'); }),
      { threshold: 0.07, rootMargin: '0px 0px -32px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="bg-[#090B14] text-[#F5F7FF] overflow-x-hidden">

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="relative pt-20 sm:pt-28 pb-16 sm:pb-24">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[#22C7F2]/[0.04] blur-[120px]" />
          <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-[#873DF5]/[0.04] blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="max-w-xl">
            <div className="reveal inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs border border-white/[0.08] bg-white/[0.03] text-white/50 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C7F2] animate-pulse" />
              <span className="font-mono font-medium text-[#22C7F2]">v0.1.0</span>
              <span className="text-white/20">·</span>
              <span>Restore. Retry. Continue.</span>
            </div>

            <h1 className="reveal reveal-delay-100 text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.08] text-[#F5F7FF] mb-5">
              Never Lose Your Users'<br className="hidden sm:block" /> Progress Again.
            </h1>

            <p className="reveal reveal-delay-200 text-base sm:text-lg text-[#F5F7FF]/50 leading-relaxed mb-8 max-w-lg">
              Recover interrupted multi-screen journeys in React Native. Preserve progress, restore application state, and let users continue exactly where they left off.
            </p>

            {/* Install command */}
            <div className="reveal reveal-delay-300 flex items-center gap-0 rounded-xl border border-white/[0.08] bg-[#0D1120] overflow-hidden mb-6 hover:border-white/12 transition-colors">
              <div className="flex items-center gap-2 px-4 py-3 flex-1 min-w-0">
                <span className="text-[#22C7F2]/50 font-mono text-xs shrink-0">$</span>
                <code className="text-xs sm:text-sm font-mono text-[#F5F7FF]/70 truncate">
                  npm install react-native-journey-recovery
                </code>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-all border-l border-white/[0.06] cursor-pointer ${
                  copied ? 'text-emerald-400 bg-emerald-500/8' : 'text-white/35 hover:text-white/70 hover:bg-white/[0.04]'
                }`}
              >
                {copied ? <><IconCheck size={12} className="text-emerald-400" /><span>Copied!</span></> : <><IconCopy size={12} /><span>Copy</span></>}
              </button>
            </div>

            {/* CTAs */}
            <div className="reveal reveal-delay-400 flex flex-wrap gap-3 mb-8">
              <button
                type="button"
                onClick={() => onNavigate('docs', 'quickstart')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#22C7F2] text-[#090B14] hover:bg-[#3ACFEF] transition-all shadow-[0_0_24px_rgba(34,199,242,0.3)] hover:shadow-[0_0_32px_rgba(34,199,242,0.4)] hover:-translate-y-px cursor-pointer"
              >
                Get Started
                <IconChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('docs')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium border border-white/[0.08] bg-white/[0.03] text-[#F5F7FF]/65 hover:text-[#F5F7FF] hover:bg-white/[0.06] hover:border-white/12 transition-all cursor-pointer"
              >
                Explore Documentation
              </button>
            </div>

            {/* Compatibility badges */}
            <div className="reveal reveal-delay-500 flex flex-wrap items-center gap-2 text-[11px] text-white/30">
              {['React Native', 'Expo', 'TypeScript', 'iOS', 'Android', 'MIT'].map((tag, i) => (
                <span key={tag} className={`px-2.5 py-1 rounded-lg border ${i === 5 ? 'border-emerald-500/20 text-emerald-400/70 bg-emerald-500/[0.04]' : 'border-white/[0.06] bg-white/[0.02] text-white/35'}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Visualization */}
          <div className="reveal reveal-delay-200 flex justify-center lg:justify-end">
            <HeroVisualization />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TRUST STRIP
      ══════════════════════════════════════════════ */}
      <div className="border-y border-white/[0.05] py-5">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 justify-center sm:justify-start">
            <span className="text-xs text-white/20 shrink-0 font-medium">Built for the ecosystem</span>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {['React Native', 'Expo', 'MMKV', 'AsyncStorage', 'React Navigation', 'Expo Router', 'React Hook Form'].map((name) => (
                <span key={name} className="text-xs font-medium text-white/30 hover:text-white/50 transition-colors whitespace-nowrap">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PROBLEM → SOLUTION
      ══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-14">
            <p className="reveal text-xs font-semibold uppercase tracking-widest text-[#22C7F2]/60 mb-3">The Problem</p>
            <h2 className="reveal reveal-delay-100 text-2xl sm:text-3xl font-bold text-[#F5F7FF] leading-tight">
              Mobile apps get interrupted.<br />User progress shouldn't.
            </h2>
            <p className="reveal reveal-delay-200 text-sm text-[#F5F7FF]/45 mt-4 leading-relaxed">
              iOS Jetsam and Android Low Memory Killer terminate background processes without warning, destroying in-progress multi-step flows.
            </p>
          </div>

          <div className="reveal grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Without */}
            <div className="rounded-2xl border border-red-500/12 bg-red-500/[0.02] p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-6 h-6 rounded-full bg-red-500/15 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <span className="text-sm font-semibold text-red-400">Without Journey Recovery</span>
              </div>
              <div className="space-y-3">
                {[
                  ['User starts multi-step checkout', 'neutral'],
                  ['Fills 3 of 5 steps — 15 minutes in', 'neutral'],
                  ['App receives phone call, goes to background', 'warning'],
                  ['OS kills the process (memory pressure)', 'bad'],
                  ['User returns to app...', 'neutral'],
                  ['Step 1 of 5. All data gone.', 'bad'],
                  ['User abandons journey.', 'bad'],
                ].map(([text, type], i) => (
                  <div key={i} className={`flex items-center gap-3 text-sm ${type === 'bad' ? 'text-red-400/80' : type === 'warning' ? 'text-amber-400/60' : 'text-white/40'}`}>
                    <span className="shrink-0 text-[10px]">{type === 'bad' ? '✗' : type === 'warning' ? '⚡' : '·'}</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* With */}
            <div className="rounded-2xl border border-[#22C7F2]/15 bg-[#22C7F2]/[0.02] p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-6 h-6 rounded-full bg-[#22C7F2]/15 flex items-center justify-center">
                  <IconCheck size={10} className="text-[#22C7F2]" />
                </div>
                <span className="text-sm font-semibold text-[#22C7F2]">With Journey Recovery</span>
              </div>
              <div className="space-y-3">
                {[
                  ['User starts multi-step checkout', 'neutral'],
                  ['Fills 3 of 5 steps — progress checkpointed', 'good'],
                  ['App receives phone call, goes to background', 'neutral'],
                  ['OS kills the process (memory pressure)', 'neutral'],
                  ['User returns to app...', 'neutral'],
                  ['"Resume where you left off?" banner appears', 'good'],
                  ['User continues from Step 3. Journey complete.', 'good'],
                ].map(([text, type], i) => (
                  <div key={i} className={`flex items-center gap-3 text-sm ${type === 'good' ? 'text-[#22C7F2]/80' : 'text-white/40'}`}>
                    <span className="shrink-0 text-[10px]">{type === 'good' ? '✓' : '·'}</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <p className="reveal text-xs font-semibold uppercase tracking-widest text-[#873DF5]/70 mb-3">How It Works</p>
            <h2 className="reveal reveal-delay-100 text-2xl sm:text-3xl font-bold text-[#F5F7FF]">
              Three steps to unbreakable user flows
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

            {[
              {
                n: '01', icon: <IconLayers size={18} className="text-[#22C7F2]" />, title: 'Capture',
                desc: "During normal app use, the library automatically checkpoints your journey state to persistent storage. Each checkpoint is atomic, FNV-1a verified, and debounced to avoid write thrash.",
              },
              {
                n: '02', icon: <IconZap size={18} className="text-[#873DF5]" />, title: 'Recover',
                desc: "When the app relaunches (whether after a crash, OS kill, or normal restart), Journey Recovery detects existing checkpoints and surfaces them via the RecoveryBanner component.",
              },
              {
                n: '03', icon: <IconCheck size={18} className="text-[#22C7F2]" />, title: 'Continue',
                desc: "One tap restores the full journey state: form values, step position, and any contextual data you chose to persist. Users continue exactly where they left off — no frustration, no data loss.",
              },
            ].map((step, i) => (
              <div key={step.n} className={`reveal reveal-delay-${(i + 1) * 100} relative`}>
                <div className="p-6 rounded-2xl border border-white/[0.07] bg-[#0D1120] h-full hover:border-white/12 transition-colors group">
                  <div className="flex items-start gap-4 mb-4">
                    <span className="text-[11px] font-mono font-bold text-white/20 mt-1">{step.n}</span>
                    <div className="w-9 h-9 rounded-xl border border-white/[0.07] bg-white/[0.03] flex items-center justify-center group-hover:border-white/12 transition-colors">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-[#F5F7FF] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#F5F7FF]/45 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-14">
            <p className="reveal text-xs font-semibold uppercase tracking-widest text-[#22C7F2]/60 mb-3">Features</p>
            <h2 className="reveal reveal-delay-100 text-2xl sm:text-3xl font-bold text-[#F5F7FF]">
              Production-grade reliability,<br className="hidden sm:block" /> zero configuration.
            </h2>
          </div>

          {/* Two primary feature cards */}
          <div className="reveal grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div className="p-7 rounded-2xl border border-[#22C7F2]/12 bg-[#22C7F2]/[0.02] hover:bg-[#22C7F2]/[0.04] transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-[#22C7F2]/10 border border-[#22C7F2]/15 flex items-center justify-center mb-4 group-hover:bg-[#22C7F2]/15 transition-colors">
                <IconLock size={18} className="text-[#22C7F2]" />
              </div>
              <h3 className="text-base font-bold text-[#F5F7FF] mb-2">Promise FIFO Mutex</h3>
              <p className="text-sm text-[#F5F7FF]/45 leading-relaxed">
                Per-journey write queue serializes rapid save operations into sequential promises. Never drops writes, eliminates async race conditions entirely — even with debounced autosave at 400ms.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-[#873DF5]/12 bg-[#873DF5]/[0.02] hover:bg-[#873DF5]/[0.04] transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-[#873DF5]/10 border border-[#873DF5]/15 flex items-center justify-center mb-4 group-hover:bg-[#873DF5]/15 transition-colors">
                <IconShield size={18} className="text-[#873DF5]" />
              </div>
              <h3 className="text-base font-bold text-[#F5F7FF] mb-2">FNV-1a Checksums</h3>
              <p className="text-sm text-[#F5F7FF]/45 leading-relaxed">
                Every checkpoint is tagged with a 32-bit FNV-1a hash. Before restoring, the engine recomputes and compares — detecting truncated writes, storage corruption, and unauthorized modification.
              </p>
            </div>
          </div>

          {/* Secondary feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <IconZap size={15} className="text-[#22C7F2]" />, title: 'Field-Level Privacy', desc: 'Declare exclude fields to strip passwords, CVV, and PII before serialization. Never touches flash.' },
              { icon: <IconDatabase size={15} className="text-[#873DF5]" />, title: 'Pluggable Adapters', desc: 'MMKV, AsyncStorage, Expo SecureStore, and an in-memory testing adapter. Full interface contract.' },
              { icon: <IconLayers size={15} className="text-[#22C7F2]" />, title: 'TTL Expiry Policies', desc: 'Global and per-journey time-to-live. Expired checkpoints are silently skipped on restore.' },
              { icon: <IconCheck size={15} className="text-[#873DF5]" />, title: 'Schema Migration', desc: 'Version-aware checkpoint engine. Migrate stale payloads between app releases without data loss.' },
            ].map((f, i) => (
              <div key={f.title} className={`reveal reveal-delay-${(i + 1) * 100} p-5 rounded-2xl border border-white/[0.06] bg-[#0D1120] hover:border-white/10 hover:-translate-y-0.5 transition-all group`}>
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3 group-hover:bg-white/[0.07] transition-colors">
                  {f.icon}
                </div>
                <h4 className="text-sm font-semibold text-[#F5F7FF] mb-1.5">{f.title}</h4>
                <p className="text-xs text-[#F5F7FF]/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          INTERACTIVE SIMULATOR
      ══════════════════════════════════════════════ */}
      <section id="simulator" className="py-20 sm:py-28 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-12">
            <p className="reveal text-xs font-semibold uppercase tracking-widest text-[#873DF5]/70 mb-3">Live Demo</p>
            <h2 className="reveal reveal-delay-100 text-2xl sm:text-3xl font-bold text-[#F5F7FF]">See it in action</h2>
            <p className="reveal reveal-delay-200 text-sm text-[#F5F7FF]/45 mt-3 leading-relaxed">
              Fill the form, save a checkpoint, then simulate an app interruption. Watch the recovery engine restore your progress.
            </p>
          </div>

          <div className="reveal">
            <JourneySimulator />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CODE EXAMPLES
      ══════════════════════════════════════════════ */}
      <section id="examples" className="py-20 sm:py-28 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-10">
            <p className="reveal text-xs font-semibold uppercase tracking-widest text-[#22C7F2]/60 mb-3">Code Examples</p>
            <h2 className="reveal reveal-delay-100 text-2xl sm:text-3xl font-bold text-[#F5F7FF]">
              Up and running in minutes
            </h2>
          </div>

          <div className="reveal grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Tab selector */}
            <div className="lg:col-span-2 flex flex-row lg:flex-col gap-2">
              {(Object.entries(CODE_TABS) as [keyof typeof CODE_TABS, typeof CODE_TABS[keyof typeof CODE_TABS]][]).map(([key, tab]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCodeTab(key)}
                  className={`flex-1 lg:flex-none text-left px-4 py-3 rounded-xl text-sm transition-all cursor-pointer ${
                    codeTab === key
                      ? 'bg-[#22C7F2]/10 border border-[#22C7F2]/20 text-[#22C7F2] font-semibold'
                      : 'border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                  }`}
                >
                  <span className={`text-[10px] font-mono mr-2 ${codeTab === key ? 'text-[#22C7F2]/60' : 'text-white/20'}`}>
                    {(['01', '02', '03', '04'] as const)[(['install','setup','checkpoint','recovery'] as const).indexOf(key as 'install'|'setup'|'checkpoint'|'recovery')]}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code block */}
            <div className="lg:col-span-3">
              <CodeBlock
                language={CODE_TABS[codeTab].language}
                title={CODE_TABS[codeTab].label}
                code={CODE_TABS[codeTab].code}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          INTEGRATIONS
      ══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="reveal text-xs font-semibold uppercase tracking-widest text-[#873DF5]/70 mb-3">Integrations</p>
            <h2 className="reveal reveal-delay-100 text-2xl sm:text-3xl font-bold text-[#F5F7FF]">
              Works with your stack
            </h2>
            <p className="reveal reveal-delay-200 text-sm text-[#F5F7FF]/40 mt-3">
              First-class adapters for the most popular React Native tools and libraries.
            </p>
          </div>

          <div className="reveal grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {INTEGRATIONS.map((int, i) => (
              <div
                key={int.name}
                className={`reveal reveal-delay-${(i % 5 + 1) * 100} p-4 rounded-xl border border-white/[0.06] bg-[#0D1120] hover:border-white/10 hover:bg-[#111827] transition-all group cursor-default`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: int.color }} />
                  <span className="text-[9px] font-mono font-semibold uppercase tracking-wider" style={{ color: `${int.color}70` }}>
                    {int.category}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#F5F7FF]/80 group-hover:text-[#F5F7FF] transition-colors">{int.name}</p>
                <p className="text-[10px] text-[#F5F7FF]/30 mt-1 leading-relaxed">{int.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <p className="reveal text-xs font-semibold uppercase tracking-widest text-[#22C7F2]/60 mb-3">FAQ</p>
            <h2 className="reveal reveal-delay-100 text-2xl sm:text-3xl font-bold text-[#F5F7FF]">Common questions</h2>
          </div>

          <div className="reveal space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem
                key={i}
                q={item.q}
                a={item.a}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>

          <div className="reveal mt-10 text-center">
            <p className="text-sm text-[#F5F7FF]/30">
              More questions?{' '}
              <a
                href="https://github.com/Imdvlpr99/react-native-journey-recovery/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#22C7F2]/70 hover:text-[#22C7F2] transition-colors"
              >
                Open an issue on GitHub →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="reveal relative rounded-3xl border border-white/[0.07] bg-[#0D1120] overflow-hidden px-8 py-16 sm:px-16 sm:py-20 text-center">
            {/* Glow effect */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#22C7F2]/[0.06] blur-3xl" />
              <div className="absolute bottom-[-80px] left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full bg-[#873DF5]/[0.06] blur-3xl" />
            </div>

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#22C7F2]/15 bg-[#22C7F2]/[0.06] text-[#22C7F2]/70 text-xs font-mono mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C7F2] animate-pulse" />
                Zero Native Modules · MIT License · TypeScript Strict
              </div>

              <h2 className="text-2xl sm:text-4xl font-bold text-[#F5F7FF] leading-tight mb-4">
                Build Mobile Experiences<br className="hidden sm:block" /> That Never Lose Progress.
              </h2>
              <p className="text-sm sm:text-base text-[#F5F7FF]/45 max-w-lg mx-auto leading-relaxed mb-10">
                Give your users the confidence to leave, return, and continue exactly where they left off.
              </p>

              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => onNavigate('docs', 'quickstart')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[#22C7F2] text-[#090B14] hover:bg-[#3ACFEF] transition-all shadow-[0_0_28px_rgba(34,199,242,0.3)] hover:shadow-[0_0_40px_rgba(34,199,242,0.4)] hover:-translate-y-px cursor-pointer"
                >
                  Get Started
                  <IconChevronRight size={14} />
                </button>
                <a
                  href="https://github.com/Imdvlpr99/react-native-journey-recovery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border border-white/[0.08] bg-white/[0.03] text-[#F5F7FF]/65 hover:text-[#F5F7FF] hover:bg-white/[0.06] transition-all"
                >
                  <IconGithub size={15} />
                  View on GitHub
                </a>
                <button
                  type="button"
                  onClick={() => onNavigate('docs')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border border-white/[0.08] bg-white/[0.03] text-[#F5F7FF]/65 hover:text-[#F5F7FF] hover:bg-white/[0.06] transition-all cursor-pointer"
                >
                  Read Docs
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
