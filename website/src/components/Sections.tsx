import React from 'react';
import { CodeBlock } from './CodeBlock';
import { Simulator } from './Simulator';

export const Sections: React.FC = () => {
  return (
    <>
      {/* Overview */}
      <section id="overview" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Overview
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
          Mobile operating systems forcefully terminate background processes due to system memory constraints (OOM) or battery management policies without running final shutdown callbacks.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
          <code>react-native-journey-recovery</code> is a developer-first recovery engine designed for React Native and Expo. It establishes an explicit, safe, and verifiable checkpointing lifecycle. When your users are filling out a KYC verification, multi-screen checkout, or onboarding wizard, they will never lose progress.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBlock: '24px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🔒</span>
            <h4 style={{ color: '#f8fafc', fontSize: '15px', marginBottom: '6px' }}>Atomic &amp; Mutex-Protected</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Per-journey promise mutex queue serializes high-frequency saves, eliminating write races. A failed save never destroys the prior committed snapshot.</p>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🛡️</span>
            <h4 style={{ color: '#f8fafc', fontSize: '15px', marginBottom: '6px' }}>Tamper &amp; Corruption Proof</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Deterministic FNV-1a checksums detect storage corruption or manual tampering before any restoration occurs.</p>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🔄</span>
            <h4 style={{ color: '#f8fafc', fontSize: '15px', marginBottom: '6px' }}>Schema Migrations</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Ship app updates with confidence. Older snapshot schemas are safely upgraded on restore via custom migration handlers.</p>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>⏳</span>
            <h4 style={{ color: '#f8fafc', fontSize: '15px', marginBottom: '6px' }}>TTL Expiry Policies</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Configurable time-to-live policies prevent stale, obsolete sessions from lingering or auto-restoring after deadlines.</p>
          </div>
        </div>
      </section>

      {/* Why Journey Recovery */}
      <section id="why-journey-recovery" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Why Journey Recovery vs Simple Persistence?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
          Most apps attempt session persistence by auto-serializing their entire global Redux or Zustand store. This creates critical security risks, large storage bloat, stale backend assumptions, and fragile restore bugs.
        </p>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', marginBlock: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0f172a', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: '#f8fafc' }}>Capability</th>
                <th style={{ padding: '12px 16px', color: '#f8fafc' }}>Standard Key-Value Persistence</th>
                <th style={{ padding: '12px 16px', color: 'var(--accent-cyan)' }}>react-native-journey-recovery</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>Scope</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Global store dump (entire state tree)</td>
                <td style={{ padding: '12px 16px', color: '#f8fafc', fontWeight: 600 }}>Selective journey checkpoints (explicit fields only)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>Concurrent Writes</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Last-write-wins (silent data races)</td>
                <td style={{ padding: '12px 16px', color: 'var(--accent-emerald)', fontWeight: 600 }}>Serialized Promise Mutex Queue</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>Write Failure Safety</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Corrupts key if write is interrupted</td>
                <td style={{ padding: '12px 16px', color: '#f8fafc', fontWeight: 600 }}>Atomic preservation of prior checkpoint</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>Corruption Detection</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Syntax errors only</td>
                <td style={{ padding: '12px 16px', color: 'var(--accent-cyan)', fontWeight: 600 }}>Deterministic FNV-1a Checksum</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>Schema Evolution</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Breaks app on version change</td>
                <td style={{ padding: '12px 16px', color: '#f8fafc', fontWeight: 600 }}>Built-in migrate() handler</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>Server Cache Sync</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Assumes saved UI is backend truth</td>
                <td style={{ padding: '12px 16px', color: 'var(--accent-indigo)', fontWeight: 600 }}>TanStack Query cache revalidation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Installation */}
      <section id="installation" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Installation
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
          Install <code>react-native-journey-recovery</code> alongside your preferred persistent storage adapter:
        </p>

        <CodeBlock
          language="bash"
          title="Terminal"
          code={`# npm
npm install react-native-journey-recovery @react-native-async-storage/async-storage

# yarn
yarn add react-native-journey-recovery @react-native-async-storage/async-storage

# pnpm
pnpm add react-native-journey-recovery @react-native-async-storage/async-storage

# Expo
npx expo install react-native-journey-recovery @react-native-async-storage/async-storage`}
        />
      </section>

      {/* Quickstart */}
      <section id="quickstart" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Quickstart (3 Steps)
        </h2>

        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBlock: '24px 10px' }}>
          Step 1: Wrap App with RecoveryProvider
        </h3>
        <CodeBlock
          language="tsx"
          title="App.tsx"
          code={`import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecoveryProvider, AsyncStorageAdapter } from 'react-native-journey-recovery';
import { AppNavigator } from './AppNavigator';

const storage = new AsyncStorageAdapter(AsyncStorage);

export default function App() {
  return (
    <RecoveryProvider storage={storage} options={{ defaultExpiry: 24 * 60 * 60 * 1000 }}>
      <AppNavigator />
    </RecoveryProvider>
  );
}`}
        />

        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBlock: '24px 10px' }}>
          Step 2: Checkpoint Journey Progress
        </h3>
        <CodeBlock
          language="tsx"
          title="CheckoutScreen.tsx"
          code={`import { useJourney } from 'react-native-journey-recovery';

export function CheckoutScreen({ currentStep, cartData }) {
  const journey = useJourney('checkout-flow', {
    version: 1,
    autoSave: true,
    debounceMs: 500,
  });

  const onNextStep = async (nextStepData) => {
    // Automatically saved with mutex protection and checksum
    await journey.checkpoint({
      step: currentStep + 1,
      ...nextStepData,
    }, {
      exclude: ['creditCardNumber', 'cvv'], // Sensitive fields stripped
    });
  };

  // ...
}`}
        />

        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBlock: '24px 10px' }}>
          Step 3: Restore or Offer Recovery
        </h3>
        <CodeBlock
          language="tsx"
          title="HomeScreen.tsx"
          code={`import { useRecovery, RecoveryBanner } from 'react-native-journey-recovery';

export function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <RecoveryBanner
        journeyId="checkout-flow"
        title="Resume unfinished checkout?"
        onRestored={(savedData) => {
          navigation.navigate('Checkout', savedData);
        }}
      />
      {/* Rest of your Home Screen */}
    </View>
  );
}`}
        />
      </section>

      {/* Write Serialization & Mutex */}
      <section id="write-serialization" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Write Serialization &amp; Mutex Queue
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
          When forms auto-save on rapid keystrokes, storage writes can resolve out of order. <code>CheckpointManager</code> maintains an internal per-journey Promise FIFO queue guaranteeing that operations execute strictly sequentially:
        </p>
        <CodeBlock
          language="typescript"
          title="Concurrency Model"
          code={`// User types "A", then "AB", then "ABC" within 50ms:
// Write 1 ("A")   ---> Enqueued & starts writing
// Write 2 ("AB")  ---> Waits for Write 1
// Write 3 ("ABC") ---> Waits for Write 2
// Guaranteed: Write 3 commits last. Zero race conditions.`}
        />
      </section>

      {/* Atomic Snapshot Safety */}
      <section id="atomic-safety" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Atomic Snapshot Preservation
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
          If a device experiences a sudden out-of-quota error or disk I/O interruption during an in-flight write, <code>CheckpointManager</code> preserves the previous valid checkpoint. It never leaves partial, corrupt JSON on disk.
        </p>
      </section>

      {/* FNV-1a Checksums */}
      <section id="checksum-integrity" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          FNV-1a Checksum Integrity
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
          Every snapshot stored carries an 8-character deterministic 32-bit FNV-1a hash of the serialized payload. Upon restoration, <code>SnapshotValidator</code> re-computes the hash:
        </p>
        <CodeBlock
          language="typescript"
          title="Integrity Verification"
          code={`const expectedChecksum = computeChecksum(JSON.stringify(snapshot.data));
if (snapshot.checksum !== expectedChecksum) {
  // Integrity compromised! Recovery denied for safety.
  throw new JourneyRecoveryError('SNAPSHOT_CORRUPTED');
}`}
        />
      </section>

      {/* TTL Expiration */}
      <section id="expiry-policies" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          TTL Expiration Policies
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
          Avoid zombie sessions. Configure expiry at the provider level or per journey:
        </p>
        <CodeBlock
          language="tsx"
          title="Per-Journey Expiry"
          code={`const journey = useJourney('checkout', {
  expiry: 2 * 60 * 60 * 1000, // 2 hours
});`}
        />
      </section>

      {/* Schema Migration */}
      <section id="schema-migration" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Schema Version Migration
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
          When shipping v2 of your application with changed form field names, older v1 checkpoints are smoothly upgraded on the fly:
        </p>
        <CodeBlock
          language="tsx"
          title="Migration Callback"
          code={`const journey = useJourney('user-profile', {
  version: 2,
  migrate: (oldData: any, oldVersion: number) => {
    if (oldVersion === 1) {
      return {
        fullName: \`\${oldData.firstName} \${oldData.lastName}\`,
        email: oldData.email,
      };
    }
    return oldData;
  },
});`}
        />
      </section>

      {/* Storage Adapters */}
      <section id="storage-async" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Storage Adapters
        </h2>

        <h3 id="storage-mmkv" style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBlock: '20px 8px' }}>
          1. MMKV Storage Adapter (High Performance)
        </h3>
        <CodeBlock
          language="tsx"
          title="MMKV Adapter"
          code={`import { MMKV } from 'react-native-mmkv';
import { MMKVStorageAdapter, RecoveryProvider } from 'react-native-journey-recovery';

const mmkv = new MMKV({ id: 'journey-storage' });
const storage = new MMKVStorageAdapter(mmkv);

<RecoveryProvider storage={storage}> ... </RecoveryProvider>`}
        />

        <h3 id="storage-memory" style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBlock: '20px 8px' }}>
          2. Memory Storage Adapter (Testing &amp; Ephemeral Flows)
        </h3>
        <CodeBlock
          language="typescript"
          code={`import { MemoryStorageAdapter } from 'react-native-journey-recovery';
const storage = new MemoryStorageAdapter();`}
        />

        <h3 id="storage-custom" style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBlock: '20px 8px' }}>
          3. Custom Storage Adapter
        </h3>
        <CodeBlock
          language="typescript"
          title="Custom Adapter Interface"
          code={`import { StorageAdapter } from 'react-native-journey-recovery';

export class EncryptedSQLCipherAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return db.query('SELECT val FROM store WHERE key = ?', [key]);
  }
  async setItem(key: string, value: string): Promise<void> {
    await db.execute('REPLACE INTO store (key, val) VALUES (?, ?)', [key, value]);
  }
  async removeItem(key: string): Promise<void> {
    await db.execute('DELETE FROM store WHERE key = ?', [key]);
  }
}`}
        />
      </section>

      {/* Navigation Adapters */}
      <section id="nav-react-navigation" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Navigation Adapters
        </h2>

        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBlock: '20px 8px' }}>
          React Navigation Stack Adapter
        </h3>
        <CodeBlock
          language="typescript"
          title="React Navigation"
          code={`import { createNavigationAdapter } from 'react-native-journey-recovery';

const adapter = createNavigationAdapter(navigation);
const navContext = adapter.getNavigationContext(); // { currentRoute, params, routeHistory }
adapter.restoreNavigation(navContext, { resetStack: true });`}
        />

        <h3 id="nav-expo-router" style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBlock: '20px 8px' }}>
          Expo Router File-Based Adapter
        </h3>
        <CodeBlock
          language="typescript"
          title="Expo Router"
          code={`import { useRouter, usePathname, useSegments, useLocalSearchParams } from 'expo-router';
import { createExpoRouterAdapter } from 'react-native-journey-recovery';

const router = useRouter();
const pathname = usePathname();
const segments = useSegments();
const params = useLocalSearchParams();

const adapter = createExpoRouterAdapter(router, () => ({ pathname, segments, params }));
adapter.restoreRoute(savedRouteContext, { mode: 'replace' });`}
        />
      </section>

      {/* Form & State Integrations */}
      <section id="integration-hook-form" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Form &amp; State Integrations
        </h2>

        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBlock: '20px 8px' }}>
          React Hook Form (`useJourneyForm`)
        </h3>
        <CodeBlock
          language="tsx"
          code={`import { useForm } from 'react-hook-form';
import { useJourneyForm } from 'react-native-journey-recovery';

export function ProfileForm() {
  const form = useForm<ProfileData>();
  const { hasSavedProgress, restoreToForm, clearForm } = useJourneyForm('profile-flow', form, {
    autoSave: true,
    exclude: ['password'],
  });

  return (
    <View>
      {hasSavedProgress && <Button title="Resume Draft" onPress={restoreToForm} />}
    </View>
  );
}`}
        />

        <h3 id="integration-formik" style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBlock: '20px 8px' }}>
          Formik (`useJourneyFormik`)
        </h3>
        <CodeBlock
          language="tsx"
          code={`import { useFormik } from 'formik';
import { useJourneyFormik } from 'react-native-journey-recovery';

const formik = useFormik({
  initialValues: { email: '', name: '' },
  onSubmit: (values) => submit(values),
});

const { hasSavedProgress, restoreToFormik } = useJourneyFormik('signup-flow', formik);`}
        />

        <h3 id="integration-zustand" style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBlock: '20px 8px' }}>
          Zustand Slice Persistence (`useJourneyZustand`)
        </h3>
        <CodeBlock
          language="tsx"
          code={`const { hasSavedProgress, restoreToStore } = useJourneyZustand(
  'cart-slice',
  useAppStore,
  (state) => state.cart
);`}
        />

        <h3 id="integration-redux" style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBlock: '20px 8px' }}>
          Redux Slice Persistence (`useJourneyRedux`)
        </h3>
        <CodeBlock
          language="tsx"
          code={`const { hasSavedProgress, restoreToRedux } = useJourneyRedux(
  'loan-slice',
  reduxStore,
  (state) => state.loanApplication
);`}
        />

        <h3 id="integration-tanstack-query" style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBlock: '20px 8px' }}>
          TanStack Query Server Cache Coordination (`useJourneyQuery`)
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
          Coordinate client state recovery with server-owned cache invalidation:
        </p>
        <CodeBlock
          language="tsx"
          code={`import { useJourneyQuery } from 'react-native-journey-recovery';

const { available, restoreAndRevalidate, discardAndReset } = useJourneyQuery('checkout-flow', {
  queryClient,
  invalidateOnRestore: [['cart', cartId], ['inventory']],
  refetchOnRestore: [['pricing']],
  resetOnClear: [['temporary-hold']],
  onRevalidated: async (data) => {
    console.log('Restored with fresh server prices:', data);
  },
});`}
        />
      </section>

      {/* Zod Validation */}
      <section id="validation-zod" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Zod Schema Validation
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
          Enforce strict runtime validation on restored data using <code>createZodValidator</code>:
        </p>
        <CodeBlock
          language="tsx"
          title="Zod Validator"
          code={`import { z } from 'zod';
import { useJourney, createZodValidator } from 'react-native-journey-recovery';

const BookingSchema = z.object({
  flightNumber: z.string(),
  seats: z.number().int().positive(),
  destination: z.string(),
});

type BookingData = z.infer<typeof BookingSchema>;

export function BookingWizard() {
  const journey = useJourney<BookingData>('flight-booking', {
    version: 1,
    validate: createZodValidator(BookingSchema), // Rejects malformed checkpoints
  });
}`}
        />
      </section>

      {/* Privacy & User Scoping */}
      <section id="security-privacy" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Privacy &amp; Field Exclusions
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
          Never persist passwords, PINs, or raw credit cards. Always supply the <code>exclude</code> parameter:
        </p>
        <CodeBlock
          language="typescript"
          code={`await journey.checkpoint(formState, {
  exclude: ['password', 'confirmPassword', 'cvv', 'token'],
});`}
        />

        <h3 id="user-scoping" style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBlock: '20px 8px' }}>
          User Identity Scoping (Shared Devices)
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
          Scope all checkpoints per authenticated user ID:
        </p>
        <CodeBlock
          language="tsx"
          code={`<RecoveryProvider storage={storage} options={{ userId: currentUserId }}>

// On user logout:
await checkpointManager.clearUserJourneys(currentUserId);`}
        />
      </section>

      {/* RecoveryBanner Component */}
      <section id="ui-recovery-banner" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          RecoveryBanner Component
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
          Accessible, themed recovery banner out of the box, or headless via the <code>render</code> prop:
        </p>
        <CodeBlock
          language="tsx"
          code={`import { RecoveryBanner } from 'react-native-journey-recovery';

<RecoveryBanner
  journeyId="checkout-flow"
  title="Resume your unfinished order?"
  onRestored={(data) => navigateToCheckout(data)}
/>`}
        />
      </section>

      {/* Diagnostics */}
      <section id="diagnostics" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Recovery Diagnostics
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
          Inspect whether and why a journey checkpoint is recoverable:
        </p>
        <CodeBlock
          language="typescript"
          code={`const diag = await recoveryManager.getDiagnostics('checkout-flow');
console.log(diag);
// {
//   exists: true,
//   status: 'available',
//   isRecoverable: true,
//   payloadSizeBytes: 1482,
//   hasChecksum: true,
//   checksumValid: true,
//   isExpired: false,
//   timeUntilExpiryMs: 86392000,
//   isEligibleForMigration: false,
//   formatVersion: 1
// }`}
        />
      </section>

      {/* Testing Utilities */}
      <section id="testing-utilities" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Developer Testing Utilities
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
          Write robust unit tests for your screens with <code>initTestRecoveryEnvironment</code>:
        </p>
        <CodeBlock
          language="tsx"
          title="Jest / Vitest Test"
          code={`import { renderHook } from '@testing-library/react';
import { initTestRecoveryEnvironment, useRecovery } from 'react-native-journey-recovery';

it('detects draft recovery', async () => {
  const env = await initTestRecoveryEnvironment({
    initialCheckpoints: {
      'checkout': { data: { step: 2, total: 99 } },
    },
  });

  const { result } = renderHook(() => useRecovery('checkout'), {
    wrapper: env.wrapper,
  });

  expect(result.current.available).toBe(true);
  expect(result.current.snapshot?.data.step).toBe(2);
});`}
        />
      </section>

      {/* Live Interactive Simulator */}
      <section id="interactive-simulator" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Live Interactive Simulator
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '16px' }}>
          Experience the engine right now in your browser. Type into the form, test background OS process termination (SIGKILL), tamper with data, and verify FNV-1a checksum protection:
        </p>

        <Simulator />
      </section>

      {/* API Reference */}
      <section id="api-reference" className="doc-section" style={{ marginBottom: '64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          API Reference &amp; ADRs
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
          Complete method contracts and architectural decision records:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBlock: '20px' }}>
          <a
            href="https://github.com/Imdvlpr99/react-native-journey-recovery/blob/master/docs/api-reference.md"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '20px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>📖</span>
            <h4 style={{ color: 'var(--accent-cyan)', fontSize: '16px', marginBottom: '6px' }}>API Reference Document</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Every method, prop, handle, and error code exhaustively documented.</p>
          </a>

          <a
            href="https://github.com/Imdvlpr99/react-native-journey-recovery/tree/master/docs/adr"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '20px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🏛️</span>
            <h4 style={{ color: 'var(--accent-cyan)', fontSize: '16px', marginBottom: '6px' }}>Architecture Decision Records</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>ADR 0001 (Pure TS), ADR 0002 (Storage Adapter Architecture), ADR 0003 (Write Serialization).</p>
          </a>
        </div>
      </section>
    </>
  );
};

