import React, { useState } from 'react';
import { IconLayers, IconShield, IconZap, IconDatabase, IconLock, IconCheck, IconChevronRight } from './Icons';

interface ArchStage {
  id: string;
  number: string;
  name: string;
  shortDesc: string;
  icon: React.ReactNode;
  badge: string;
  responsibilities: string[];
  failureProtection: string;
  codeSnippet: string;
  dataTransformTitle: string;
  dataTransformContent: string;
}

const STAGES: ArchStage[] = [
  {
    id: 'hooks',
    number: '01',
    name: 'React Hook Interface',
    shortDesc: 'Declarative API for components and forms',
    icon: <IconZap size={18} />,
    badge: 'UI Layer',
    responsibilities: [
      'Provides useJourney, useRecovery, and useJourneyForm hooks',
      'Configures debounced autoSave (default 400ms) on rapid keystrokes',
      'Exposes restore/discard handles to prompt banners and modals',
      'Enforces TypeScript generic type safety across state fields'
    ],
    failureProtection: 'Handles component unmounts cleanly without leaking background timers or dangling promises.',
    codeSnippet: `const journey = useJourney('checkout-flow', {
  version: 1,
  autoSave: true,
  debounceMs: 400,
  exclude: ['creditCard', 'cvv'],
});`,
    dataTransformTitle: 'Raw In-Memory State Input',
    dataTransformContent: `{
  "step": 2,
  "email": "developer@reactnative.dev",
  "creditCard": "4242-4242-4242-4242",
  "cvv": "789"
}`,
  },
  {
    id: 'mutex',
    number: '02',
    name: 'Promise Mutex FIFO Queue',
    shortDesc: 'Eliminates concurrent write races',
    icon: <IconLayers size={18} />,
    badge: 'Concurrency Engine',
    responsibilities: [
      'Per-journey promise chain guarantees strict write ordering',
      'Serializes simultaneous keystrokes, navigation transitions, and app state changes',
      'Never drops in-flight save requests while active',
      'Maintains synchronous in-memory state cache for instant read access'
    ],
    failureProtection: 'If Write N throws a storage error, the mutex queue catches the error and cleanly advances to Write N+1 without blocking the queue.',
    codeSnippet: `// Internal mutex implementation:
private writeQueue = new Map<string, Promise<any>>();

private serialize<T>(journeyId: string, op: () => Promise<T>): Promise<T> {
  const current = this.writeQueue.get(journeyId) || Promise.resolve();
  const next = current.then(op, op);
  this.writeQueue.set(journeyId, next);
  return next;
}`,
    dataTransformTitle: 'FIFO Mutex Queue Pipeline State',
    dataTransformContent: `[Queue Status: SERIALIZED]
  ├── Operation #1: [Active In-Flight Disk Write] (Commit pending)
  └── Operation #2: [Enqueued in FIFO Chain] (Awaiting Op #1)

* Concurrency Race Immunity: 100%
* Write #2 will NEVER resolve before Write #1 completes.`,
  },
  {
    id: 'serializer',
    number: '03',
    name: 'Serializer & Integrity Hasher',
    shortDesc: 'FNV-1a checksum and field exclusion',
    icon: <IconShield size={18} />,
    badge: 'Data Integrity',
    responsibilities: [
      'Strips confidential properties specified in exclude list',
      'Computes deterministic 32-bit FNV-1a checksum across JSON payload',
      'Attaches _formatVersion, createdAt, updatedAt, and expiresAt timestamps',
      'Enforces schema validation and triggers migrate() callback if version changed'
    ],
    failureProtection: 'Corrupted disk data, truncated JSON files, or manual tampering are rejected immediately upon restoration.',
    codeSnippet: `const serializedData = JSON.stringify(safePayload);
const checksum = computeChecksum(serializedData);

const snapshot: JourneySnapshot = {
  _formatVersion: 1,
  id: journeyId,
  version: 1,
  checksum, // e.g. "b4a8e102"
  createdAt: 1731234000000,
  expiresAt: 1731320400000,
  data: safePayload,
};`,
    dataTransformTitle: 'Sanitized Snapshot (Stripped & Checksummed)',
    dataTransformContent: `{
  "_formatVersion": 1,
  "id": "checkout-flow",
  "version": 1,
  "checksum": "3b2a9e14", // Deterministic 32-bit FNV-1a
  "createdAt": 1731456000000,
  "expiresAt": 1731542400000,
  "data": {
    "step": 2,
    "email": "developer@reactnative.dev"
    // creditCard & cvv STRIPPED before disk serialization!
  }
}`,
  },
  {
    id: 'adapter',
    number: '04',
    name: 'Storage Adapter Layer',
    shortDesc: 'Pluggable storage engine abstraction',
    icon: <IconDatabase size={18} />,
    badge: 'Hardware Abstraction',
    responsibilities: [
      'Standardized StorageAdapter contract (getItem, setItem, removeItem)',
      'AsyncStorageAdapter for universal standard persistence',
      'MMKVStorageAdapter for ultra-fast C++ zero-overhead persistence',
      'SecureStoreAdapter for iOS Keychain & Android Keystore encryption'
    ],
    failureProtection: 'SecureStoreAdapter automatically chunks payloads >1800 bytes to prevent Android native Keystore buffer crashes.',
    codeSnippet: `export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}`,
    dataTransformTitle: 'Storage Adapter Dispatch',
    dataTransformContent: `Target Adapter: MMKVStorageAdapter
Storage Driver: react-native-mmkv (C++ direct memory mapping)
Write Throughput: 0.04ms average write latency
Serialization Overhead: 0 bridge crossings`,
  },
  {
    id: 'persistence',
    number: '05',
    name: 'OS Persistence & Storage',
    shortDesc: 'Non-volatile mobile flash memory',
    icon: <IconLock size={18} />,
    badge: 'Hardware Storage',
    responsibilities: [
      'Persisted in app sandbox storage on Android and iOS',
      'Survives complete OS process termination (SIGKILL / OOM)',
      'Survives system reboots and app updates',
      'Partitioned per user ID if user scoping is configured'
    ],
    failureProtection: 'Atomic preservation ensures a disk write error during save preserves the prior valid checkpoint untouched.',
    codeSnippet: `// Storage Key Scheme:
@rn_journey:\${journeyId}
// With User Scoping:
@rn_journey:\${userId}:\${journeyId}`,
    dataTransformTitle: 'Hardware Flash Commitment',
    dataTransformContent: `Key: @rn_journey:checkout-flow
Partition: Non-volatile application sandbox flash
Survivability:
  ✓ Android Low Memory Killer (LMK) / SIGKILL
  ✓ iOS Jetsam process termination
  ✓ Device power loss / system reboot
  ✓ Prior committed snapshot preserved if disk write fails`,
  },
];

export const ArchitectureVisualizer: React.FC = () => {
  const [activeStageIdx, setActiveStageIdx] = useState(1);
  const activeStage = STAGES[activeStageIdx];

  const handlePrev = () => {
    setActiveStageIdx((prev) => (prev > 0 ? prev - 1 : STAGES.length - 1));
  };

  const handleNext = () => {
    setActiveStageIdx((prev) => (prev < STAGES.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/8">
        <div>
          <div className="text-[11px] font-mono font-semibold text-violet-400 uppercase tracking-wider mb-0.5">
            System Blueprint &amp; Data Pipeline
          </div>
          <h3 className="text-lg font-bold tracking-tight text-white">
            Lifecycle &amp; Write Pipeline
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Inspect concurrency serialization, failure safety, and state transformation step-by-step:
          </p>
        </div>

        {/* Step Navigation Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            className="px-2.5 py-1 rounded-lg border border-white/10 text-xs font-medium text-white/50 hover:text-white bg-white/5 hover:bg-white/8 cursor-pointer transition-colors"
            title="Previous Stage"
          >
            ← Prev
          </button>
          <span className="text-xs font-mono font-semibold text-white/40">
            {activeStageIdx + 1} / {STAGES.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="px-2.5 py-1 rounded-lg border border-white/10 text-xs font-medium text-white/50 hover:text-white bg-white/5 hover:bg-white/8 cursor-pointer transition-colors"
            title="Next Stage"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Interactive Pipeline Stages Strip */}
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 overflow-x-auto pb-1">
        {STAGES.map((stage, idx) => {
          const isSelected = idx === activeStageIdx;
          return (
            <React.Fragment key={stage.id}>
              <button
                type="button"
                onClick={() => setActiveStageIdx(idx)}
                className={`flex-1 min-w-[150px] text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-violet-500/60 bg-violet-500/15'
                    : 'border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/8'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-mono font-bold ${isSelected ? 'text-violet-400' : 'text-white/30'}`}>
                    {stage.number}
                  </span>
                  <span className={`p-1 rounded ${isSelected ? 'text-violet-400' : 'text-white/40'}`}>
                    {stage.icon}
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate">
                  {stage.name}
                </div>
                <div className="text-[10px] text-white/40 mt-0.5 truncate">
                  {stage.badge}
                </div>
              </button>

              {idx < STAGES.length - 1 && (
                <div className="hidden lg:flex items-center justify-center text-white/15 px-0.5 select-none text-xs">
                  →
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Selected Stage Detail Panel */}
      <div className="rounded-xl border border-white/8 bg-black/20 p-5 space-y-6">
        {/* Stage Header Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-400/25">
              {activeStage.icon}
            </span>
            <div>
              <div className="text-[11px] font-mono font-semibold text-violet-400 uppercase tracking-wider">
                STAGE {activeStage.number} · {activeStage.badge}
              </div>
              <h4 className="text-base font-bold text-white">
                {activeStage.name}
              </h4>
              <p className="text-xs text-white/50">
                {activeStage.shortDesc}
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Left Responsibilities & Safety, Right Code & Live Data Transform */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <div className="text-xs font-semibold text-white mb-2.5">
                Primary Responsibilities
              </div>
              <ul className="space-y-2">
                {activeStage.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/60 leading-relaxed">
                    <span className="text-violet-400 mt-0.5 shrink-0">
                      <IconCheck size={13} />
                    </span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl border border-white/8 bg-white/5 space-y-1">
              <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <IconShield size={13} className="text-emerald-400" />
                <span>Failure &amp; Exception Handling</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                {activeStage.failureProtection}
              </p>
            </div>
          </div>

          {/* Right Column (7 cols): Data Packet Transformation + Code */}
          <div className="lg:col-span-7 space-y-4">
            {/* Live Data Packet Inspector */}
            <div className="rounded-xl border border-white/8 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 bg-white/5">
                <span className="text-[11px] font-mono font-semibold text-violet-400 uppercase">
                  Data State: {activeStage.dataTransformTitle}
                </span>
                <span className="text-[10px] font-mono text-white/30">STAGE {activeStage.number}</span>
              </div>
              <pre className="p-3 text-xs font-mono text-violet-200/80 overflow-x-auto leading-relaxed bg-[#0d0b1e]">
                <code>{activeStage.dataTransformContent}</code>
              </pre>
            </div>

            {/* Implementation Code */}
            <div className="rounded-xl border border-white/8 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 bg-white/5">
                <span className="text-[11px] font-mono font-medium text-white/60">
                  Implementation Details
                </span>
                <span className="text-[10px] font-mono uppercase text-white/40">TypeScript</span>
              </div>
              <pre className="p-3 font-mono text-xs text-white/80 overflow-x-auto leading-relaxed bg-[#060910]">
                <code>{activeStage.codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
