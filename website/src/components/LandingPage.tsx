import React, { useState } from 'react';
import { ActiveTab } from './Navbar';
import { CodeBlock } from './CodeBlock';
import {
  IconCopy, IconCheck, IconShield, IconZap,
  IconDatabase, IconLayers, IconChevronRight, IconLock,
} from './Icons';

interface LandingPageProps {
  onNavigate: (tab: ActiveTab, sectionId?: string) => void;
  onOpenSearch: () => void;
}

type PkgManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'expo';
type LearnStep = 'provider' | 'journey' | 'recovery';
type AdapterChoice = 'async-storage' | 'mmkv' | 'secure-store';

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [pkgManager, setPkgManager] = useState<PkgManager>('npm');
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [activeStep, setActiveStep] = useState<LearnStep>('journey');
  const [selectedAdapter, setSelectedAdapter] = useState<AdapterChoice>('async-storage');

  const installCommands: Record<PkgManager, string> = {
    npm: 'npm install react-native-journey-recovery @react-native-async-storage/async-storage',
    pnpm: 'pnpm add react-native-journey-recovery @react-native-async-storage/async-storage',
    yarn: 'yarn add react-native-journey-recovery @react-native-async-storage/async-storage',
    bun: 'bun add react-native-journey-recovery @react-native-async-storage/async-storage',
    expo: 'npx expo install react-native-journey-recovery @react-native-async-storage/async-storage',
  };

  const handleCopyInstall = async () => {
    try {
      await navigator.clipboard.writeText(installCommands[pkgManager]);
      setCopiedInstall(true);
      setTimeout(() => setCopiedInstall(false), 2000);
    } catch {
      // ignore
    }
  };

  const getStepCode = () => {
    if (activeStep === 'provider') {
      if (selectedAdapter === 'mmkv') {
        return `import React from 'react';
import { MMKV } from 'react-native-mmkv';
import { RecoveryProvider, MMKVStorageAdapter } from 'react-native-journey-recovery';

// C++ Synchronous MMKV storage (<0.05ms write latency)
const mmkvInstance = new MMKV();
const storage = new MMKVStorageAdapter(mmkvInstance);

export default function App() {
  return (
    <RecoveryProvider storage={storage} options={{ defaultExpiry: 24 * 60 * 60 * 1000 }}>
      <AppNavigator />
    </RecoveryProvider>
  );
}`;
      }
      if (selectedAdapter === 'secure-store') {
        return `import React from 'react';
import * as SecureStore from 'expo-secure-store';
import { RecoveryProvider, SecureStoreAdapter } from 'react-native-journey-recovery';

// Hardware-backed iOS Keychain & Android Keystore encryption
const storage = new SecureStoreAdapter(SecureStore);

export default function App() {
  return (
    <RecoveryProvider storage={storage} options={{ defaultExpiry: 12 * 60 * 60 * 1000 }}>
      <AppNavigator />
    </RecoveryProvider>
  );
}`;
      }
      return `import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecoveryProvider, AsyncStorageAdapter } from 'react-native-journey-recovery';

// Universal persistent storage (Zero configuration, Expo Go ready)
const storage = new AsyncStorageAdapter(AsyncStorage);

export default function App() {
  return (
    <RecoveryProvider storage={storage} options={{ defaultExpiry: 24 * 60 * 60 * 1000 }}>
      <AppNavigator />
    </RecoveryProvider>
  );
}`;
    }

    if (activeStep === 'journey') {
      return `import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import { useJourney } from 'react-native-journey-recovery';

interface CheckoutForm {
  step: number;
  email: string;
  shippingAddress: string;
  creditCardCvv: string; // Excluded from storage!
}

export function CheckoutScreen({ navigation }) {
  const [form, setForm] = useState<CheckoutForm>({
    step: 1, email: '', shippingAddress: '', creditCardCvv: ''
  });

  // Mutex-protected checkpointing with automatic 400ms debounce
  const journey = useJourney<CheckoutForm>('checkout-flow', {
    version: 1,
    autoSave: true,
    debounceMs: 400,
  });

  const handleNext = async () => {
    // Sensitive keys are stripped before serialization; 32-bit FNV-1a checksum is attached
    await journey.checkpoint(form, {
      exclude: ['creditCardCvv'],
    });
    navigation.navigate('Step2');
  };

  return (
    <View>
      <TextInput
        value={form.email}
        onChangeText={(text) => {
          const next = { ...form, email: text };
          setForm(next);
          journey.save(next, { exclude: ['creditCardCvv'] });
        }}
      />
      <Button title="Continue" onPress={handleNext} />
    </View>
  );
}`;
    }

    return `import React from 'react';
import { View, Text } from 'react-native';
import { RecoveryBanner, useRecovery } from 'react-native-journey-recovery';

export function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      {/*
        RecoveryBanner automatically detects if an eligible checkpoint exists.
        It verifies the 32-bit FNV-1a checksum and checks expiration before prompting.
      */}
      <RecoveryBanner
        journeyId="checkout-flow"
        title="Resume your checkout order?"
        onResume={(savedData) => {
          navigation.navigate('Checkout', savedData);
        }}
        onDiscard={() => {
          console.log('Checkpoint cleanly purged');
        }}
      />

      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Welcome Back</Text>
    </View>
  );
}`;
  };

  return (
    <div className="space-y-20 pb-20">

      {/* ── HERO ── */}
      <section className="pt-16 sm:pt-24 pb-8 flex flex-col items-center text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-7 flex flex-col items-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border border-white/15 bg-white/8 text-white/70 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-medium text-violet-300">v0.1.0</span>
            <span className="text-white/20">·</span>
            <span>Zero Native Dependencies</span>
            <span className="text-white/20">·</span>
            <span>Pure TypeScript</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.06] bg-gradient-to-br from-white via-violet-100 to-violet-300 bg-clip-text text-transparent">
            Deterministic state recovery<br className="hidden sm:block" /> for React Native &amp; Expo.
          </h1>

          {/* Sub-headline */}
          <p className="text-base sm:text-lg text-white/60 max-w-xl leading-relaxed">
            Checkpoint multi-screen flows, eliminate async write races with a Promise FIFO mutex, and restore in-flight progress after OS background kills.
          </p>

          {/* Install bar — frosted glass */}
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-lg shadow-black/20">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/8">
              <span className="text-[11px] font-mono text-white/30">$ install</span>
              <div className="flex items-center gap-0.5">
                {(['npm', 'pnpm', 'yarn', 'bun', 'expo'] as PkgManager[]).map((pkg) => (
                  <button
                    key={pkg}
                    type="button"
                    onClick={() => setPkgManager(pkg)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      pkgManager === pkg
                        ? 'bg-violet-500 text-white font-semibold'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {pkg}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <code className="text-xs sm:text-sm font-mono text-violet-300 truncate">
                {installCommands[pkgManager]}
              </code>
              <button
                type="button"
                onClick={handleCopyInstall}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-sans transition-colors cursor-pointer shrink-0 ${
                  copiedInstall
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-white/8 hover:bg-white/15 text-white/60 hover:text-white border border-white/10'
                }`}
                title="Copy installation command"
              >
                {copiedInstall ? (
                  <>
                    <IconCheck size={13} className="text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <IconCopy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('docs', 'quickstart')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white transition-all shadow-lg shadow-violet-500/30 cursor-pointer"
            >
              Read the Docs
              <IconChevronRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('architecture')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-white/15 bg-white/8 hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer backdrop-blur-sm"
            >
              <IconLayers size={15} className="text-violet-400" />
              Engine Architecture
            </button>
          </div>
        </div>
      </section>

      {/* ── 3-STEP WALKTHROUGH ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-wider text-violet-400/70">
              Interactive Walkthrough
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              How the engine works in 3 steps
            </h2>
            <p className="text-xs sm:text-sm text-white/50 max-w-xl">
              Click through each step to see how clean checkpoint recovery is in production:
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('docs', 'quickstart')}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Read Step-by-Step Guide</span>
            <IconChevronRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Step selectors */}
          <div className="lg:col-span-5 space-y-3">
            {/* Step 1 */}
            <div
              onClick={() => setActiveStep('provider')}
              className={`p-4 rounded-xl border transition-all cursor-pointer backdrop-blur-sm ${
                activeStep === 'provider'
                  ? 'border-violet-400/40 bg-violet-500/10 shadow-sm shadow-violet-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                  activeStep === 'provider'
                    ? 'bg-violet-500 text-white'
                    : 'bg-white/10 text-white/40'
                }`}>
                  01
                </span>
                <h4 className="text-sm font-semibold text-white">
                  Wrap Root with RecoveryProvider
                </h4>
              </div>
              <p className="text-xs text-white/50 mt-2 pl-8 leading-relaxed">
                Configure your chosen storage adapter once at the application root. Supports TTL expiry and automatic schema migration callbacks.
              </p>
              {activeStep === 'provider' && (
                <div className="mt-3 pl-8 flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-white/30 uppercase font-mono">Adapter:</span>
                  {(['async-storage', 'mmkv', 'secure-store'] as AdapterChoice[]).map((adapter) => (
                    <button
                      key={adapter}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAdapter(adapter);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                        selectedAdapter === adapter
                          ? 'bg-violet-500/25 text-violet-300 font-semibold border border-violet-400/40'
                          : 'bg-white/8 text-white/40 hover:text-white/60'
                      }`}
                    >
                      {adapter === 'async-storage' ? 'AsyncStorage' : adapter === 'mmkv' ? 'MMKV' : 'SecureStore'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2 */}
            <div
              onClick={() => setActiveStep('journey')}
              className={`p-4 rounded-xl border transition-all cursor-pointer backdrop-blur-sm ${
                activeStep === 'journey'
                  ? 'border-violet-400/40 bg-violet-500/10 shadow-sm shadow-violet-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                  activeStep === 'journey'
                    ? 'bg-violet-500 text-white'
                    : 'bg-white/10 text-white/40'
                }`}>
                  02
                </span>
                <h4 className="text-sm font-semibold text-white">
                  Checkpoint State with useJourney()
                </h4>
              </div>
              <p className="text-xs text-white/50 mt-2 pl-8 leading-relaxed">
                Bind any screen, form, or checkout wizard to a journey ID. Rapid keystrokes are automatically debounced and serialized through the Mutex Queue.
              </p>
            </div>

            {/* Step 3 */}
            <div
              onClick={() => setActiveStep('recovery')}
              className={`p-4 rounded-xl border transition-all cursor-pointer backdrop-blur-sm ${
                activeStep === 'recovery'
                  ? 'border-violet-400/40 bg-violet-500/10 shadow-sm shadow-violet-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                  activeStep === 'recovery'
                    ? 'bg-violet-500 text-white'
                    : 'bg-white/10 text-white/40'
                }`}>
                  03
                </span>
                <h4 className="text-sm font-semibold text-white">
                  Prompt Recovery with RecoveryBanner
                </h4>
              </div>
              <p className="text-xs text-white/50 mt-2 pl-8 leading-relaxed">
                When the app relaunches after an OS background termination, drop in <code className="font-mono text-[11px] text-violet-300">&lt;RecoveryBanner /&gt;</code> to prompt the user to seamlessly resume.
              </p>
            </div>
          </div>

          {/* Code preview */}
          <div className="lg:col-span-7">
            <CodeBlock
              language="tsx"
              title={
                activeStep === 'provider'
                  ? `App.tsx (${selectedAdapter === 'mmkv' ? 'MMKV' : selectedAdapter === 'secure-store' ? 'SecureStore' : 'AsyncStorage'})`
                  : activeStep === 'journey'
                  ? 'CheckoutScreen.tsx (Checkpoint Hook)'
                  : 'HomeScreen.tsx (Recovery Prompt UI)'
              }
              code={getStepCode()}
            />
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-2.5 hover:border-violet-400/30 hover:bg-white/8 transition-all">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <IconLock size={15} className="text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Promise FIFO Mutex</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Serializes rapid keystrokes into sequential writes. Never drops writes, eliminates async race conditions entirely.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-2.5 hover:border-violet-400/30 hover:bg-white/8 transition-all">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <IconShield size={15} className="text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">FNV-1a Checksums</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              32-bit deterministic hash verifies integrity before restoring. Rejects corrupted or truncated disk snapshots.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-2.5 hover:border-violet-400/30 hover:bg-white/8 transition-all">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <IconZap size={15} className="text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Field-Level Privacy</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Declare sensitive fields like <code className="font-mono text-[11px] text-violet-300">password</code> or <code className="font-mono text-[11px] text-violet-300">cvv</code>. Stripped before serialization — never touches flash.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-2.5 hover:border-violet-400/30 hover:bg-white/8 transition-all">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <IconDatabase size={15} className="text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Pluggable Adapters</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Native drivers for MMKV (C++ sync), Expo SecureStore (Hardware Keychain), and AsyncStorage.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
