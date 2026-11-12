import React from 'react';
import { CodeBlock } from './CodeBlock';
import { ArchitectureVisualizer } from './ArchitectureVisualizer';
import { StorageComparison } from './StorageComparison';
import {
  IconCheck, IconShield, IconZap, IconDatabase,
  IconLock, IconAlertTriangle, IconExternalLink
} from './Icons';

export const Sections: React.FC<{ activeId?: string }> = ({ activeId }) => {
  return (
    <>
      {activeId && (
        <style>{`.doc-section:not(#${activeId}) { display: none; }`}</style>
      )}
      {/* Overview */}
      <section id="overview" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Overview
          </h2>
        </div>

        <p className="text-base md:text-lg text-white/70 leading-relaxed mb-4">
          Mobile operating systems forcefully terminate background processes due to system memory pressure (Android Low Memory Killer / iOS jetsam) or battery optimization policies without firing JavaScript cleanup handlers or state-flushing lifecycle callbacks.
        </p>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6">
          <code className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 font-mono text-xs border border-violet-400/20">react-native-journey-recovery</code> is a developer-first state recovery engine designed specifically for React Native and Expo. It establishes an explicit, safe, and verifiable checkpointing lifecycle. When your users are filling out a multi-step mortgage application, complex checkout wizard, airline check-in, or KYC verification, they will never lose in-progress progress.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
          <div className="p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center mb-3">
              <IconLock size={18} />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Atomic &amp; Mutex-Protected
            </h4>
            <p className="text-xs text-white/55 leading-relaxed">
              Per-journey Promise FIFO queue serializes rapid saves into sequential promises, eliminating write races. A failed or interrupted write never destroys the prior committed snapshot.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center mb-3">
              <IconShield size={18} />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Tamper &amp; Corruption Proof
            </h4>
            <p className="text-xs text-white/55 leading-relaxed">
              Deterministic 32-bit FNV-1a checksums detect storage corruption, truncated writes, or unauthorized payload modification before any restoration can occur.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center mb-3">
              <IconZap size={18} />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Schema Version Migrations
            </h4>
            <p className="text-xs text-white/55 leading-relaxed">
              Ship app updates with confidence. Outdated snapshot schemas from previous versions are seamlessly upgraded on the fly via the <code className="text-xs font-mono text-violet-300">migrate()</code> callback.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center mb-3">
              <IconDatabase size={18} />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              TTL Expiry &amp; Scoping
            </h4>
            <p className="text-xs text-white/55 leading-relaxed">
              Configurable time-to-live expiration policies prevent stale sessions from lingering, with multi-tenant user scoping for shared devices.
            </p>
          </div>
        </div>
      </section>

      {/* Why Journey Recovery */}
      <section id="why-journey-recovery" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Why Journey Recovery vs Generic Store Persistence?
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6">
          Many mobile apps attempt session persistence by auto-serializing their entire global Redux or Zustand state tree to storage on every action. In real-world production mobile apps, this generic pattern introduces serious architectural pitfalls:
        </p>

        {/* Warning Callout */}
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 flex items-start gap-3 mb-6">
          <IconAlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
              The Danger of Whole-Store Dumps
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300/80 leading-relaxed">
              Whole-store dumps inadvertently persist sensitive authentication tokens, confidential credit card numbers, stale backend pricing, and temporary UI toggles. Furthermore, rapid keystrokes trigger concurrent async disk writes that resolve out of order, overwriting newer state with older snapshots.
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-white/40 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Capability</th>
                <th className="py-3 px-4 text-white/30">Global Store Dump (redux-persist)</th>
                <th className="py-3 px-4 text-violet-400 font-semibold">react-native-journey-recovery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 text-xs">
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 font-semibold text-white">Storage Scope</td>
                <td className="py-3 px-4 text-white/40">Entire state tree (massive disk bloat)</td>
                <td className="py-3 px-4 font-medium text-white">Selective journey checkpoints (explicit fields only)</td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 font-semibold text-white">Concurrent Write Races</td>
                <td className="py-3 px-4 text-white/40">Last-write-wins (silent race conditions)</td>
                <td className="py-3 px-4 font-medium text-white">Serialized Promise FIFO Mutex Queue</td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 font-semibold text-white">Write Failure Safety</td>
                <td className="py-3 px-4 text-white/40">Leaves partial corrupted JSON on disk</td>
                <td className="py-3 px-4 font-medium text-white">Atomic preservation of previous committed snapshot</td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 font-semibold text-white">Data Corruption Detection</td>
                <td className="py-3 px-4 text-white/40">JSON syntax errors only</td>
                <td className="py-3 px-4 font-medium text-white">Deterministic 32-bit FNV-1a Checksums</td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 font-semibold text-white">Schema Evolution</td>
                <td className="py-3 px-4 text-white/40">App crashes on changed field types</td>
                <td className="py-3 px-4 font-medium text-white">Built-in <code className="font-mono text-xs text-violet-300">migrate()</code> version upgrade hook</td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 font-semibold text-white">Server Cache Sync</td>
                <td className="py-3 px-4 text-white/40">Assumes saved UI state is backend truth</td>
                <td className="py-3 px-4 font-medium text-white">TanStack Query automatic cache revalidation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Installation */}
      <section id="installation" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Installation
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6">
          Install <code className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-400/20 font-mono text-xs">react-native-journey-recovery</code> using your preferred package manager alongside your choice of storage adapter:
        </p>

        <CodeBlock
          tabs={[
            {
              label: 'npm',
              language: 'bash',
              code: 'npm install react-native-journey-recovery @react-native-async-storage/async-storage',
            },
            {
              label: 'pnpm',
              language: 'bash',
              code: 'pnpm add react-native-journey-recovery @react-native-async-storage/async-storage',
            },
            {
              label: 'yarn',
              language: 'bash',
              code: 'yarn add react-native-journey-recovery @react-native-async-storage/async-storage',
            },
            {
              label: 'bun',
              language: 'bash',
              code: 'bun add react-native-journey-recovery @react-native-async-storage/async-storage',
            },
            {
              label: 'Expo',
              language: 'bash',
              code: 'npx expo install react-native-journey-recovery @react-native-async-storage/async-storage',
            },
          ]}
        />
      </section>

      {/* Quickstart in 3 Steps */}
      <section id="quickstart" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Quickstart in 3 Steps
          </h2>
        </div>

        <div className="space-y-8 mt-6">
          {/* Step 1 */}
          <div className="flex gap-4 items-start">
            <div className="flex flex-col items-center">
              <span className="w-7 h-7 rounded-lg bg-violet-500 text-white font-bold font-mono text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div className="w-0.5 h-full bg-white/10 mt-3 min-h-[40px]" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-bold text-white">
                Wrap App with RecoveryProvider
              </h3>
              <p className="text-sm text-white/60 leading-relaxed mb-3">
                Initialize your preferred storage adapter (AsyncStorage, MMKV, or SecureStore) and wrap your root component tree:
              </p>
              <CodeBlock
                language="tsx"
                title="App.tsx"
                code={`import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecoveryProvider, AsyncStorageAdapter } from 'react-native-journey-recovery';
import { AppNavigator } from './navigation/AppNavigator';

// 1. Initialize persistent storage adapter
const storage = new AsyncStorageAdapter(AsyncStorage);

export default function App() {
  return (
    <RecoveryProvider
      storage={storage}
      options={{
        defaultExpiry: 24 * 60 * 60 * 1000, // 24 hours TTL
      }}
    >
      <AppNavigator />
    </RecoveryProvider>
  );
}`}
              />
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 items-start">
            <div className="flex flex-col items-center">
              <span className="w-7 h-7 rounded-lg bg-violet-500 text-white font-bold font-mono text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div className="w-0.5 h-full bg-white/10 mt-3 min-h-[40px]" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-bold text-white">
                Checkpoint Journey State
              </h3>
              <p className="text-sm text-white/60 leading-relaxed mb-3">
                Use <code className="font-mono text-xs">useJourney</code> to checkpoint form values and navigation step transitions. Sensitive fields are excluded:
              </p>
              <CodeBlock
                language="tsx"
                title="CheckoutScreen.tsx"
                code={`import React, { useState } from 'react';
import { View, Button } from 'react-native';
import { useJourney } from 'react-native-journey-recovery';

interface CheckoutState {
  step: number;
  shippingAddress: string;
  creditCardNumber: string; // Excluded!
}

export function CheckoutScreen() {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [ccNumber, setCcNumber] = useState('');

  // Per-journey checkpointing with automatic mutex write serialization
  const journey = useJourney<CheckoutState>('checkout-flow', {
    version: 1,
    autoSave: true,
    debounceMs: 400,
  });

  const handleNextStep = async () => {
    await journey.checkpoint({
      step: step + 1,
      shippingAddress: address,
      creditCardNumber: ccNumber,
    }, {
      exclude: ['creditCardNumber'], // Stripped before disk serialization!
    });
    setStep(step + 1);
  };

  return (
    <View>
      {/* Screen inputs */}
      <Button title="Continue" onPress={handleNextStep} />
    </View>
  );
}`}
              />
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 items-start">
            <div className="flex flex-col items-center">
              <span className="w-7 h-7 rounded-lg bg-violet-500 text-white font-bold font-mono text-xs flex items-center justify-center shrink-0">
                3
              </span>
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-bold text-white">
                Prompt Recovery on App Launch
              </h3>
              <p className="text-sm text-white/60 leading-relaxed mb-3">
                When the user returns to the app, <code className="font-mono text-xs">RecoveryBanner</code> or <code className="font-mono text-xs">useRecovery</code> checks for uncommitted checkpoints and prompts the user to resume:
              </p>
              <CodeBlock
                language="tsx"
                title="HomeScreen.tsx"
                code={`import React from 'react';
import { View, Text } from 'react-native';
import { RecoveryBanner } from 'react-native-journey-recovery';

export function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      {/* Appears automatically if an eligible checkpoint exists */}
      <RecoveryBanner
        journeyId="checkout-flow"
        title="Resume your unfinished order?"
        onResume={(savedData) => {
          navigation.navigate('Checkout', savedData);
        }}
        onDiscard={() => {
          console.log('Checkpoint purged');
        }}
      />

      <Text>Welcome back!</Text>
    </View>
  );
}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Engine Architecture Visualizer */}
      <section id="architecture-diagram" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Engine Architecture &amp; Data Pipeline
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6">
          Explore the five sequential stages of the recovery pipeline. Click each stage node below to inspect internal queuing, failure safety, and code implementation:
        </p>

        <ArchitectureVisualizer />
      </section>

      {/* Write Serialization & Mutex */}
      <section id="write-serialization" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Write Serialization &amp; Mutex Queue
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6">
          When forms auto-save on rapid typing, asynchronous storage operations can resolve out of order due to OS scheduling and thread pool variations. <code className="font-mono text-xs">CheckpointManager</code> contains a lightweight per-journey Promise FIFO mutex queue guaranteeing that saves execute sequentially:
        </p>

        <CodeBlock
          language="typescript"
          title="Concurrency Execution Trace"
          code={`// User types "A", "AB", "ABC" in 60 milliseconds:
// Write 1 ("A")   ───► Locked in Mutex ───► Commits to Storage
// Write 2 ("AB")  ───► Queued in FIFO  ───► Awaits Write 1 ───► Commits
// Write 3 ("ABC") ───► Queued in FIFO  ───► Awaits Write 2 ───► Commits (Final State)

// Result: Zero write race conditions. Write 3 is always the committed snapshot.`}
        />

        <div className="mt-6 p-4 md:p-5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 dark:bg-cyan-950/20 flex items-start gap-3.5">
          <IconZap size={20} className="text-cyan-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Benchmarked Throughput Overhead
            </div>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed">
              The promise mutex queue adds less than 0.1ms overhead per operation, delivering over 25,000 serialized operations per second in automated microbenchmarks.
            </p>
          </div>
        </div>
      </section>

      {/* Atomic Snapshot Safety */}
      <section id="atomic-safety" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Atomic Snapshot Preservation
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed">
          If a mobile device experiences sudden low storage disk exhaustion, OS sandbox permissions denial, or hardware power cut midway through writing a new checkpoint, <code className="font-mono text-xs">CheckpointManager</code> preserves the previously committed checkpoint in storage. It never leaves partial, truncated, or unparseable JSON on disk.
        </p>
      </section>

      {/* FNV-1a Checksum Integrity */}
      <section id="checksum-integrity" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            32-Bit FNV-1a Checksum Integrity
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6">
          Every stored checkpoint snapshot embeds an 8-character deterministic 32-bit Fowler–Noll–Vo (FNV-1a) hash computed across the serialized data payload. Upon restoration, <code className="font-mono text-xs">SnapshotValidator</code> recalculates the hash:
        </p>

        <CodeBlock
          language="typescript"
          title="Integrity Verification Logic"
          code={`const computedChecksum = computeChecksum(JSON.stringify(snapshot.data));

if (snapshot.checksum !== computedChecksum) {
  // Checksum mismatch detected! Storage has been tampered with or corrupted on disk.
  throw new JourneyRecoveryError(
    'CORRUPTED_STORAGE_REJECTED',
    \`Expected checksum \${snapshot.checksum}, computed \${computedChecksum}\`
  );
}`}
        />
      </section>

      {/* TTL Expiration Policies */}
      <section id="expiry-policies" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            TTL Expiration Policies
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6">
          Prevent zombie sessions. Configure expiry either globally at the <code className="font-mono text-xs">RecoveryProvider</code> level or per journey:
        </p>

        <CodeBlock
          language="tsx"
          title="Per-Journey Expiry Configuration"
          code={`const journey = useJourney('flight-booking', {
  // Expire checkpoint after 2 hours
  expiry: 2 * 60 * 60 * 1000,
});`}
        />
      </section>

      {/* Schema Version Migration */}
      <section id="schema-migration" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Schema Version Migration
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6">
          When deploying an app update with restructured field names or revised data contracts, older checkpoints saved on users&apos; devices are cleanly upgraded before restoration via the <code className="font-mono text-xs">migrate()</code> handler:
        </p>

        <CodeBlock
          language="tsx"
          title="Schema Migration Handler"
          code={`interface UserProfileV2 {
  fullName: string;
  email: string;
}

const journey = useJourney<UserProfileV2>('user-profile', {
  version: 2, // Active version
  migrate: (oldData: any, oldVersion: number): UserProfileV2 => {
    if (oldVersion === 1) {
      // Migrate v1 (firstName, lastName) to v2 (fullName)
      return {
        fullName: \`\${oldData.firstName} \${oldData.lastName}\`.trim(),
        email: oldData.email,
      };
    }
    return oldData;
  },
});`}
        />
      </section>

      {/* Storage Adapters */}
      <section id="storage-adapters" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Storage Adapters
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-8">
          <code className="font-mono text-xs">react-native-journey-recovery</code> decouples state lifecycle logic from storage implementations via the <code className="font-mono text-xs">StorageAdapter</code> interface:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div id="storage-mmkv" className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col justify-between">
            <div className="mb-4">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 mb-2">
                HIGH SPEED
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                MMKVStorageAdapter
              </h3>
              <p className="text-xs md:text-sm text-white/60 leading-relaxed">
                Direct memory-mapped C++ storage backed by Tencent MMKV. Delivers sub-millisecond synchronous writes with negligible battery consumption.
              </p>
            </div>
            <CodeBlock
              language="tsx"
              title="MMKV Adapter"
              code={`import { MMKV } from 'react-native-mmkv';
import { MMKVStorageAdapter, RecoveryProvider } from 'react-native-journey-recovery';

const mmkv = new MMKV({ id: 'journey-store' });
const storage = new MMKVStorageAdapter(mmkv);

<RecoveryProvider storage={storage}>
  <App />
</RecoveryProvider>`}
            />
          </div>

          <div id="storage-secure" className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col justify-between">
            <div className="mb-4">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-2">
                HARDWARE ENCRYPTED
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                SecureStoreAdapter (Expo)
              </h3>
              <p className="text-xs md:text-sm text-white/60 leading-relaxed">
                Hardware-backed security backed by iOS Keychain and Android Keystore. Includes automated chunking to prevent Android native 2048-byte Keystore buffer overflows.
              </p>
            </div>
            <CodeBlock
              language="tsx"
              title="SecureStore Adapter (Expo)"
              code={`import * as SecureStore from 'expo-secure-store';
import { SecureStoreAdapter, RecoveryProvider } from 'react-native-journey-recovery';

// Hardware-backed encrypted storage with safe chunking
const storage = new SecureStoreAdapter(SecureStore, {
  chunkSize: 1800, // Safe chunking for Android Keystore limits
});

<RecoveryProvider storage={storage}>
  <App />
</RecoveryProvider>`}
            />
          </div>

          <div id="storage-async" className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col justify-between">
            <div className="mb-4">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
                STANDARD PERSISTENCE
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                AsyncStorageAdapter
              </h3>
              <p className="text-xs md:text-sm text-white/60 leading-relaxed">
                Standard React Native persistent storage. Fully supported in Expo Go sandbox with zero native setup.
              </p>
            </div>
            <CodeBlock
              language="tsx"
              title="AsyncStorage Adapter"
              code={`import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageAdapter, RecoveryProvider } from 'react-native-journey-recovery';

const storage = new AsyncStorageAdapter(AsyncStorage);

<RecoveryProvider storage={storage}>
  <App />
</RecoveryProvider>`}
            />
          </div>

          <div id="storage-memory" className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col justify-between">
            <div className="mb-4">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 mb-2">
                EPHEMERAL TESTING
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                MemoryStorageAdapter
              </h3>
              <p className="text-xs md:text-sm text-white/60 leading-relaxed">
                In-memory pure JavaScript Map adapter for Jest, Vitest, CI pipelines, and Storybook previews.
              </p>
            </div>
            <CodeBlock
              language="typescript"
              title="Memory Adapter"
              code={`import { MemoryStorageAdapter } from 'react-native-journey-recovery';

const storage = new MemoryStorageAdapter();`}
            />
          </div>
        </div>
      </section>

      {/* Storage Comparison & Calculator */}
      <section id="storage-comparison" className="doc-section scroll-mt-24 mb-16 section-enter">
        <StorageComparison />
      </section>

      {/* Navigation Adapters */}
      <section id="navigation-adapters" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Navigation Adapters
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6">
          Seamlessly restore active route stacks, nested screen parameters, and tab indices after an OS process crash:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div id="nav-react-navigation" className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              React Navigation Stack Adapter
            </h3>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed mb-4">
              Synchronizes route name, params, and history with the React Navigation container:
            </p>
            <CodeBlock
              language="typescript"
              title="React Navigation Adapter"
              code={`import { createNavigationAdapter } from 'react-native-journey-recovery';

const navAdapter = createNavigationAdapter(navigationRef);

// Capture route context on checkpoint
const navContext = navAdapter.getNavigationContext();

// Restore user directly to the interrupted screen
navAdapter.restoreNavigation(navContext, { resetStack: true });`}
            />
          </div>

          <div id="nav-expo-router" className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Expo Router File-Based Adapter
            </h3>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed mb-4">
              Restores file-based paths, segments, and search params in Expo Router:
            </p>
            <CodeBlock
              language="typescript"
              title="Expo Router Adapter"
              code={`import { useRouter, usePathname, useSegments, useLocalSearchParams } from 'expo-router';
import { createExpoRouterAdapter } from 'react-native-journey-recovery';

const router = useRouter();
const pathname = usePathname();
const segments = useSegments();
const params = useLocalSearchParams();

const adapter = createExpoRouterAdapter(router, () => ({ pathname, segments, params }));
adapter.restoreRoute(savedRouteContext, { mode: 'replace' });`}
            />
          </div>
        </div>
      </section>

      {/* Form & State Integrations */}
      <section id="form-integrations" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Form &amp; State Integrations
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-8">
          Pre-built hooks for the most popular React Native form and state libraries:
        </p>

        <div className="space-y-8">
          <div id="integration-hook-form">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              1. React Hook Form (`useJourneyForm`)
            </h3>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed mb-3">
              Syncs dirty form state to storage automatically with debouncing and field exclusion:
            </p>
            <CodeBlock
              language="tsx"
              title="React Hook Form"
              code={`import { useForm } from 'react-hook-form';
import { useJourneyForm } from 'react-native-journey-recovery';

export function OnboardingForm() {
  const form = useForm<OnboardingData>();
  const { hasSavedProgress, restoreToForm, clearForm } = useJourneyForm(
    'onboarding-journey',
    form,
    {
      autoSave: true,
      exclude: ['password', 'confirmPassword'],
    }
  );

  return (
    <View>
      {hasSavedProgress && (
        <Button title="Resume Saved Draft" onPress={restoreToForm} />
      )}
    </View>
  );
}`}
            />
          </div>

          <div id="integration-formik">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              2. Formik (`useJourneyFormik`)
            </h3>
            <CodeBlock
              language="tsx"
              title="Formik"
              code={`import { useFormik } from 'formik';
import { useJourneyFormik } from 'react-native-journey-recovery';

const formik = useFormik({
  initialValues: { email: '', name: '' },
  onSubmit: (values) => submit(values),
});

const { hasSavedProgress, restoreToFormik } = useJourneyFormik('signup-flow', formik);`}
            />
          </div>

          <div id="integration-zustand">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              3. Zustand Slice Sync (`useJourneyZustand`)
            </h3>
            <CodeBlock
              language="tsx"
              title="Zustand"
              code={`import { useJourneyZustand } from 'react-native-journey-recovery';
import { useAppStore } from './store';

const { hasSavedProgress, restoreToStore } = useJourneyZustand(
  'cart-slice',
  useAppStore,
  (state) => state.cart
);`}
            />
          </div>

          <div id="integration-redux">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              4. Redux Slice Sync (`useJourneyRedux`)
            </h3>
            <CodeBlock
              language="tsx"
              title="Redux Toolkit"
              code={`import { useJourneyRedux } from 'react-native-journey-recovery';
import { reduxStore } from './store';

const { hasSavedProgress, restoreToRedux } = useJourneyRedux(
  'loan-application-slice',
  reduxStore,
  (state) => state.loanApplication
);`}
            />
          </div>

          <div id="integration-tanstack-query">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              5. TanStack Query Server Sync (`useJourneyQuery`)
            </h3>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed mb-3">
              Coordinates client checkpoint restoration with server-side query cache invalidation and refetching:
            </p>
            <CodeBlock
              language="tsx"
              title="TanStack Query"
              code={`import { useJourneyQuery } from 'react-native-journey-recovery';

const { available, restoreAndRevalidate, discardAndReset } = useJourneyQuery('checkout-flow', {
  queryClient,
  invalidateOnRestore: [['cart', cartId], ['inventory']],
  refetchOnRestore: [['pricing']],
  resetOnClear: [['temporary-reservation']],
  onRevalidated: async (restoredData) => {
    console.log('Restored with fresh server prices:', restoredData);
  },
});`}
            />
          </div>
        </div>
      </section>

      {/* Zod Validation */}
      <section id="validation-zod" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Zod Runtime Schema Validation
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6">
          Enforce strict runtime validation against stored payloads using <code className="font-mono text-xs">createZodValidator</code>. Checkpoints failing schema parsing are safely rejected:
        </p>

        <CodeBlock
          language="tsx"
          title="Zod Schema Validation"
          code={`import { z } from 'zod';
import { useJourney, createZodValidator } from 'react-native-journey-recovery';

const FlightBookingSchema = z.object({
  flightNumber: z.string().min(3),
  seatClass: z.enum(['economy', 'premium', 'business']),
  passengerCount: z.number().int().positive(),
});

type FlightBookingData = z.infer<typeof FlightBookingSchema>;

export function BookingWizard() {
  const journey = useJourney<FlightBookingData>('flight-booking', {
    version: 1,
    validate: createZodValidator(FlightBookingSchema),
  });
}`}
        />
      </section>

      {/* Privacy & User Scoping */}
      <section id="security-privacy" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Confidential Field Exclusions &amp; User Scoping
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6">
          Never persist raw passwords, CVV codes, biometric credentials, or credit cards. Provide the <code className="font-mono text-xs">exclude</code> option:
        </p>

        <CodeBlock
          language="typescript"
          title="Field Exclusion Parameter"
          code={`await journey.checkpoint(formState, {
  exclude: ['password', 'confirmPassword', 'cvv', 'rawCardNumber', 'authPin'],
});`}
        />

        <div id="user-scoping" className="mt-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            User Identity Scoping (Shared Devices)
          </h3>
          <p className="text-sm text-white/60 leading-relaxed mb-4">
            For apps used by multiple people on a single device, scope all checkpoints by user ID:
          </p>
          <CodeBlock
            language="tsx"
            title="User Scoping & Logout Cleanup"
            code={`// Scope checkpoints to the authenticated user ID
<RecoveryProvider storage={storage} options={{ userId: currentUserId }}>
  <App />
</RecoveryProvider>

// On user logout, wipe all cached checkpoints for that user:
await checkpointManager.clearUserJourneys(currentUserId);`}
          />
        </div>
      </section>

      {/* UI Components */}
      <section id="ui-components" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Recovery UI Components
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6">
          Accessible, drop-in UI components for workflow recovery prompts:
        </p>

        <div id="ui-recovery-banner" className="mb-8">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            RecoveryBanner
          </h3>
          <CodeBlock
            language="tsx"
            title="RecoveryBanner"
            code={`import { RecoveryBanner } from 'react-native-journey-recovery';

<RecoveryBanner
  journeyId="checkout-flow"
  title="Resume your unfinished order?"
  onResume={(data) => navigation.navigate('Checkout', data)}
  onDiscard={() => console.log('Discarded')}
/>`}
          />
        </div>

        <div id="ui-recovery-modal" className="mb-8">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            RecoveryModal &amp; RecoveryBottomSheet
          </h3>
          <CodeBlock
            language="tsx"
            title="Modal & Sheet Components"
            code={`import { RecoveryModal, RecoveryBottomSheet } from 'react-native-journey-recovery';

// Centered modal dialog
<RecoveryModal
  journeyId="kyc-verification"
  title="Resume KYC Verification?"
  resumeLabel="Continue"
  discardLabel="Start Over"
  onResume={(data) => resumeFlow(data)}
/>

// Slide-up bottom sheet
<RecoveryBottomSheet
  journeyId="loan-application"
  title="Unfinished Loan Application"
  onResume={(data) => resumeLoan(data)}
/>`}
          />
        </div>
      </section>

      {/* CLI Tools */}
      <section id="cli-tools" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            CLI Diagnostic Tool &amp; CI Verification
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6">
          Inspect exported checkpoint snapshots, verify FNV-1a checksums, test TTL expiration, and automate integrity testing in CI:
        </p>

        <CodeBlock
          language="bash"
          title="CLI Commands"
          code={`# Inspect snapshot and output colorized diagnostic report
npx journey-recovery inspect snapshot.json

# Automated CI verification: exits with code 0 if valid, code 1 if corrupted/expired
npx journey-recovery verify snapshot.json

# Compute 32-bit FNV-1a checksum for an arbitrary payload string
npx journey-recovery checksum '{"step":2,"name":"Alex"}'`}
        />
      </section>

      {/* Testing Utilities */}
      <section id="testing-utilities" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Testing Utilities
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6">
          Write lightning-fast unit tests using <code className="font-mono text-xs">initTestRecoveryEnvironment</code> with MemoryStorageAdapter:
        </p>

        <CodeBlock
          language="tsx"
          title="Jest / Vitest Integration Test"
          code={`import { renderHook, act } from '@testing-library/react';
import { initTestRecoveryEnvironment, useRecovery } from 'react-native-journey-recovery';

it('detects and recovers saved draft session', async () => {
  const env = await initTestRecoveryEnvironment({
    initialCheckpoints: {
      'checkout-flow': {
        data: { step: 2, shippingMethod: 'express' },
      },
    },
  });

  const { result } = renderHook(() => useRecovery('checkout-flow'), {
    wrapper: env.wrapper,
  });

  expect(result.current.available).toBe(true);
  expect(result.current.snapshot?.data.step).toBe(2);

  await act(async () => {
    await result.current.discard();
  });

  expect(result.current.available).toBe(false);
});`}
        />
      </section>

      {/* API Reference */}
      <section id="api-reference" className="doc-section scroll-mt-24 mb-16 section-enter">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            API Reference &amp; Error Contracts
          </h2>
        </div>

        <p className="text-sm md:text-base text-white/60 leading-relaxed mb-6">
          Complete interface contracts, return values, options, and error codes:
        </p>

        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-x-auto mb-8">
          <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-white/40 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Hook / Method / Component</th>
                <th className="py-3 px-4">Signature / Props</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td className="py-3 px-4 font-mono text-cyan-600 dark:text-cyan-400 font-bold whitespace-nowrap"><code>useJourney&lt;T&gt;(id, options)</code></td>
                <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap"><code>(id: string, options?: JourneyOptions) =&gt; JourneyHandle&lt;T&gt;</code></td>
                <td className="py-3 px-4 text-white/60">Manages active journey checkpointing, auto-save debounce, and field exclusions.</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td className="py-3 px-4 font-mono text-cyan-600 dark:text-cyan-400 font-bold whitespace-nowrap"><code>useRecovery&lt;T&gt;(id)</code></td>
                <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap"><code>(id: string) =&gt; RecoveryHandle&lt;T&gt;</code></td>
                <td className="py-3 px-4 text-white/60">Detects eligible uncommitted checkpoints for restoration or discard.</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td className="py-3 px-4 font-mono text-cyan-600 dark:text-cyan-400 font-bold whitespace-nowrap"><code>useJourneyForm(id, form, options)</code></td>
                <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap"><code>(id: string, form: UseFormReturn, options?: FormOptions)</code></td>
                <td className="py-3 px-4 text-white/60">React Hook Form two-way integration with dirty-tracking and draft resume.</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td className="py-3 px-4 font-mono text-cyan-600 dark:text-cyan-400 font-bold whitespace-nowrap"><code>RecoveryBanner</code></td>
                <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap"><code>{`{ journeyId, onResume, onDiscard, title? }`}</code></td>
                <td className="py-3 px-4 text-white/60">Drop-in accessible notification banner prompting user to resume draft.</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td className="py-3 px-4 font-mono text-cyan-600 dark:text-cyan-400 font-bold whitespace-nowrap"><code>RecoveryModal</code></td>
                <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap"><code>{`{ journeyId, onResume, onDiscard, title? }`}</code></td>
                <td className="py-3 px-4 text-white/60">Focused modal dialog with frosted background blur for workflow resumption.</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td className="py-3 px-4 font-mono text-cyan-600 dark:text-cyan-400 font-bold whitespace-nowrap"><code>RecoveryBottomSheet</code></td>
                <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap"><code>{`{ journeyId, onResume, onDiscard, title? }`}</code></td>
                <td className="py-3 px-4 text-white/60">Mobile slide-up bottom sheet with gesture drag handle.</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td className="py-3 px-4 font-mono text-cyan-600 dark:text-cyan-400 font-bold whitespace-nowrap"><code>createZodValidator(schema)</code></td>
                <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap"><code>(schema: ZodSchema) =&gt; ValidatorFn</code></td>
                <td className="py-3 px-4 text-white/60">Runtime schema validator rejecting malformed or invalid restored states.</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                <td className="py-3 px-4 font-mono text-cyan-600 dark:text-cyan-400 font-bold whitespace-nowrap"><code>computeChecksum(payload)</code></td>
                <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap"><code>(payload: string) =&gt; string</code></td>
                <td className="py-3 px-4 text-white/60">Computes 8-character deterministic 32-bit FNV-1a hex checksum hash.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Error Codes */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            Engine Error Codes
          </h3>
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-white/40 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Error Code</th>
                  <th className="py-3 px-4">Trigger Condition</th>
                  <th className="py-3 px-4">Engine Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-mono font-bold text-rose-500 whitespace-nowrap"><code>CORRUPTED_STORAGE_REJECTED</code></td>
                  <td className="py-3 px-4 text-white/60">Computed FNV-1a checksum does not match stored hash.</td>
                  <td className="py-3 px-4 text-slate-800 text-white/70">Restoration blocked. Throws error or triggers error prompt.</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-mono font-bold text-amber-500 whitespace-nowrap"><code>SESSION_EXPIRED</code></td>
                  <td className="py-3 px-4 text-white/60">Current timestamp exceeds snapshot <code>expiresAt</code>.</td>
                  <td className="py-3 px-4 text-slate-800 text-white/70">Checkpoint automatically purged from storage.</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-mono font-bold text-purple-500 whitespace-nowrap"><code>SCHEMA_VALIDATION_FAILED</code></td>
                  <td className="py-3 px-4 text-white/60">Payload fails Zod or custom validator check.</td>
                  <td className="py-3 px-4 text-slate-800 text-white/70">Restoration rejected to protect component integrity.</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-500 whitespace-nowrap"><code>STORAGE_WRITE_FAILED</code></td>
                  <td className="py-3 px-4 text-white/60">Storage adapter throws disk quota / IO error.</td>
                  <td className="py-3 px-4 text-slate-800 text-white/70">Prior committed checkpoint preserved untouched.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Architecture Decision Records Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <a
            href="https://github.com/Imdvlpr99/react-native-journey-recovery/blob/master/docs/adr/0001-pure-typescript-core.md"
            target="_blank"
            rel="noreferrer"
            className="group p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-violet-400/40 transition-all flex items-start gap-3"
          >
            <div className="text-xl p-2 rounded-lg bg-cyan-500/10 shrink-0">🏛️</div>
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors flex items-center gap-1">
                <span>ADR 0001: Pure TypeScript Core</span>
                <IconExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                Zero native binaries, universal Expo Go compatibility, and zero-linkage overhead.
              </p>
            </div>
          </a>

          <a
            href="https://github.com/Imdvlpr99/react-native-journey-recovery/blob/master/docs/adr/0002-storage-adapter-architecture.md"
            target="_blank"
            rel="noreferrer"
            className="group p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-violet-400/40 transition-all flex items-start gap-3"
          >
            <div className="text-xl p-2 rounded-lg bg-emerald-500/10 shrink-0">🏛️</div>
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors flex items-center gap-1">
                <span>ADR 0002: Storage Adapter Architecture</span>
                <IconExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                Decoupled adapter interfaces for AsyncStorage, MMKV, and hardware-chunked SecureStore.
              </p>
            </div>
          </a>

          <a
            href="https://github.com/Imdvlpr99/react-native-journey-recovery/blob/master/docs/adr/0003-write-serialization-and-atomic-failure-safety.md"
            target="_blank"
            rel="noreferrer"
            className="group p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-violet-400/40 transition-all flex items-start gap-3"
          >
            <div className="text-xl p-2 rounded-lg bg-indigo-500/10 shrink-0">🏛️</div>
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors flex items-center gap-1">
                <span>ADR 0003: Write Serialization &amp; Mutex</span>
                <IconExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                Per-journey Promise FIFO queue eliminating race conditions and providing atomic failure safety.
              </p>
            </div>
          </a>
        </div>
      </section>
    </>
  );
};
