import React, { useState, useMemo } from 'react';
import { IconCheck, IconX, IconSparkles, IconCopy } from './Icons';

interface AdapterInfo {
  name: string;
  driver: string;
  speed: string;
  latencyRaw: number;
  encryption: string;
  expoGo: boolean;
  idealFor: string;
  installCmd: string;
}

const ADAPTERS: AdapterInfo[] = [
  {
    name: 'MMKVStorageAdapter',
    driver: 'react-native-mmkv',
    speed: '< 0.05ms (Synchronous C++)',
    latencyRaw: 0.05,
    encryption: 'Hardware AES-256 (Optional)',
    expoGo: false,
    idealFor: 'High-frequency typing auto-saves, long wizards, zero-latency state restoration',
    installCmd: 'npm install react-native-mmkv',
  },
  {
    name: 'SecureStoreAdapter',
    driver: 'expo-secure-store',
    speed: '20-40ms (Hardware Keychain)',
    latencyRaw: 30,
    encryption: 'Hardware AES-256 (Keychain / Keystore)',
    expoGo: true,
    idealFor: 'Fintech, banking, healthcare KYC, identity verification, PCI-DSS compliance',
    installCmd: 'npx expo install expo-secure-store',
  },
  {
    name: 'AsyncStorageAdapter',
    driver: '@react-native-async-storage/async-storage',
    speed: '5-15ms (Asynchronous)',
    latencyRaw: 8,
    encryption: 'Unencrypted (Sandbox)',
    expoGo: true,
    idealFor: 'Standard multi-screen checkout, onboarding wizards, universal Expo Go apps',
    installCmd: 'npm install @react-native-async-storage/async-storage',
  },
  {
    name: 'MemoryStorageAdapter',
    driver: 'In-Memory JavaScript Map',
    speed: 'Instant (0ms)',
    latencyRaw: 0.001,
    encryption: 'RAM only (Zero persistence)',
    expoGo: true,
    idealFor: 'Automated CI/CD test suites (Vitest / Jest), headless mock environments',
    installCmd: 'Built into react-native-journey-recovery',
  },
];

type ScenarioPreset = 'standard' | 'high-frequency' | 'fintech' | 'ci';

export const StorageComparison: React.FC = () => {
  const [activePreset, setActivePreset] = useState<ScenarioPreset>('standard');
  const [payloadSizeKb, setPayloadSizeKb] = useState(2);
  const [saveIntervalMs, setSaveIntervalMs] = useState(400);
  const [requiresEncryption, setRequiresEncryption] = useState(false);
  const [isExpoGo, setIsExpoGo] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Apply presets
  const handleApplyPreset = (preset: ScenarioPreset) => {
    setActivePreset(preset);
    if (preset === 'standard') {
      setPayloadSizeKb(2);
      setSaveIntervalMs(400);
      setRequiresEncryption(false);
      setIsExpoGo(false);
    } else if (preset === 'high-frequency') {
      setPayloadSizeKb(5);
      setSaveIntervalMs(200);
      setRequiresEncryption(false);
      setIsExpoGo(false);
    } else if (preset === 'fintech') {
      setPayloadSizeKb(3);
      setSaveIntervalMs(600);
      setRequiresEncryption(true);
      setIsExpoGo(false);
    } else if (preset === 'ci') {
      setPayloadSizeKb(1);
      setSaveIntervalMs(100);
      setRequiresEncryption(false);
      setIsExpoGo(true);
    }
  };

  // Recommendation engine
  const recommendation = useMemo(() => {
    if (activePreset === 'ci') {
      return {
        adapter: 'MemoryStorageAdapter',
        reason: 'Automated testing and CI/CD. Pure in-memory Map guarantees 0ms latency without touching native flash storage.',
        package: 'Built-in (Zero installation required)',
        command: '',
        color: 'text-amber-500',
      };
    }
    if (requiresEncryption) {
      return {
        adapter: 'SecureStoreAdapter',
        reason: 'Hardware encryption required. Uses iOS Keychain & Android Keystore with automatic chunking protection against Android native 2048-byte buffer overflows.',
        package: 'expo-secure-store',
        command: 'npx expo install expo-secure-store',
        color: 'text-indigo-500',
      };
    }
    if (isExpoGo) {
      return {
        adapter: 'AsyncStorageAdapter',
        reason: 'Expo Go compatibility required. Works seamlessly in standard Expo Go sandboxes without compiling custom development builds.',
        package: '@react-native-async-storage/async-storage',
        command: 'npx expo install @react-native-async-storage/async-storage',
        color: 'text-emerald-500',
      };
    }
    if (saveIntervalMs < 300 || payloadSizeKb > 8) {
      return {
        adapter: 'MMKVStorageAdapter',
        reason: 'Fast typing frequency (<300ms) or larger state payloads (>8KB). Benefits drastically from MMKV C++ direct memory-mapped file I/O.',
        package: 'react-native-mmkv',
        command: 'npm install react-native-mmkv',
        color: 'text-sky-500',
      };
    }
    return {
      adapter: 'AsyncStorageAdapter',
      reason: 'Standard multi-step forms and checkouts. Zero native linking issues, battle-tested across millions of production React Native applications.',
      package: '@react-native-async-storage/async-storage',
      command: 'npm install @react-native-async-storage/async-storage',
      color: 'text-emerald-500',
    };
  }, [payloadSizeKb, saveIntervalMs, requiresEncryption, isExpoGo, activePreset]);

  // Flash write sizing calculator
  const stats = useMemo(() => {
    const savesPerMinute = Math.round(60000 / Math.max(saveIntervalMs, 100));
    const kbPerMinute = savesPerMinute * payloadSizeKb;
    // Assume average 4-minute checkout flow per session, 1 session per day
    const mbPerMonth = Number(((kbPerMinute * 4 * 30) / 1024).toFixed(2));

    return {
      savesPerMinute,
      kbPerMinute,
      mbPerMonth,
    };
  }, [payloadSizeKb, saveIntervalMs]);

  const copyCommand = async (cmd: string) => {
    if (!cmd) return;
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="my-6 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-5 md:p-6 space-y-6 shadow-xs">
      {/* Header */}
      <div>
        <div className="text-[11px] font-mono font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">
          Decision Matrix &amp; Sizing
        </div>
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Storage Adapters &amp; Decision Matrix
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Compare write latency, encryption guarantees, and Expo support to select the optimal adapter for your architecture:
        </p>
      </div>

      {/* Comparison Matrix Table */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-950 overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Adapter</th>
              <th className="py-3 px-4">Underlying Driver</th>
              <th className="py-3 px-4">Write Latency</th>
              <th className="py-3 px-4">Encryption</th>
              <th className="py-3 px-4 text-center">Expo Go</th>
              <th className="py-3 px-4">Best Use Case</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {ADAPTERS.map((item) => (
              <tr key={item.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 font-mono text-[11px]">
                  {item.name}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  {item.driver}
                </td>
                <td className="py-3 px-4 text-slate-900 dark:text-slate-200 font-semibold">
                  {item.speed}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                  {item.encryption}
                </td>
                <td className="py-3 px-4 text-center">
                  {item.expoGo ? (
                    <span className="inline-flex p-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <IconCheck size={13} />
                    </span>
                  ) : (
                    <span className="inline-flex p-1 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-400">
                      <IconX size={13} />
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed max-w-xs">
                  {item.idealFor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preset Scenarios Strip */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Select Application Profile:
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'standard', label: 'E-Commerce / Standard Form' },
            { id: 'high-frequency', label: 'High Typing Cadence (<300ms)' },
            { id: 'fintech', label: 'Banking / KYC (Hardware Encrypted)' },
            { id: 'ci', label: 'CI / Automated Vitest Suite' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset.id as ScenarioPreset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activePreset === preset.id
                  ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 font-semibold shadow-xs'
                  : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Sizing & Recommendation 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs (6 cols) */}
        <div className="lg:col-span-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-4">
          <div className="text-xs font-bold text-slate-900 dark:text-slate-200">
            Workload Configuration
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>Payload Size per Checkpoint:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{payloadSizeKb} KB</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={payloadSizeKb}
                onChange={(e) => setPayloadSizeKb(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>Debounced Save Interval:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{saveIntervalMs} ms</span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={saveIntervalMs}
                onChange={(e) => setSaveIntervalMs(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requiresEncryption}
                  onChange={(e) => setRequiresEncryption(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 accent-sky-500"
                />
                <span>Hardware Encryption Required (PCI/PII)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isExpoGo}
                  onChange={(e) => setIsExpoGo(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 accent-sky-500"
                />
                <span>Expo Go Sandbox Mode</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Recommended Engine (6 cols) */}
        <div className="lg:col-span-6 p-4 rounded-xl border border-sky-500/40 dark:border-sky-500/30 bg-sky-50/30 dark:bg-slate-900/60 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconSparkles size={16} className="text-sky-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Recommended Architecture
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300">
              Optimal Match
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {recommendation.adapter}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {recommendation.reason}
            </p>
          </div>

          {recommendation.command && (
            <div className="pt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono">
                <span className="truncate">{recommendation.command}</span>
                <button
                  type="button"
                  onClick={() => copyCommand(recommendation.command)}
                  className="ml-2 p-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
                  title="Copy command"
                >
                  {copiedCmd ? <IconCheck size={13} className="text-emerald-400" /> : <IconCopy size={13} />}
                </button>
              </div>
            </div>
          )}

          {/* Flash Write Volume Estimation */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-center">
            <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-950/40">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Saves/Min</div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                {stats.savesPerMinute}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-950/40">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Write Rate</div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                {stats.kbPerMinute} KB/min
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-950/40">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Monthly Flash I/O</div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {stats.mbPerMonth} MB
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
